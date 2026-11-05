const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { formidable } = require('formidable');
const AppError = require('../utils/customError');

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per photo
const STORAGE_PREFIX = 'sell-your-phone';
const UPLOAD_DIR = path.resolve(__dirname, `../uploads/${STORAGE_PREFIX}`);

// Ensure destination directory exists synchronously on startup
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validates the file signature (magic bytes) to confirm genuine image format.
 * Rejects executables, scripts, or non-image files disguised with an image extension.
 * @param {Buffer} buffer - First 12+ bytes of the file
 * @returns {string|null} - 'jpg', 'png', 'webp' if valid, null otherwise
 */
function detectImageType(buffer) {
    if (!buffer || buffer.length < 4) {
        return null;
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'jpg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    ) {
        return 'png';
    }

    // WEBP: RIFF....WEBP
    if (
        buffer.length >= 12 &&
        buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
        buffer.slice(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'webp';
    }

    return null;
}

/**
 * Safely removes a list of files from disk.
 * Handles storage keys (e.g. sell-your-phone/sell_...) or absolute paths.
 * @param {string[]} filePathsOrKeys
 */
async function cleanupFiles(filePathsOrKeys) {
    if (!Array.isArray(filePathsOrKeys)) return;

    for (const item of filePathsOrKeys) {
        if (!item || typeof item !== 'string') continue;
        try {
            let fullPath = item;
            if (item.startsWith(`${STORAGE_PREFIX}/`) || item.startsWith(`/${STORAGE_PREFIX}/`) || item.startsWith('/uploads/sell-requests/')) {
                const basename = path.basename(item);
                fullPath = path.join(UPLOAD_DIR, basename);
            }
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
            }
        } catch {
            // Ignore unlink errors during cleanup
        }
    }
}

/**
 * Middleware to parse and validate multipart/form-data phone photo uploads.
 * Enforces magic bytes verification, max 5 photos, and 5MB limit.
 */
function handleSellRequestUpload(req, res, next) {
    const contentType = req.headers['content-type'] || '';

    // If not multipart, proceed directly to validation
    if (!contentType.includes('multipart/form-data')) {
        return next();
    }

    const form = formidable({
        multiples: true,
        maxFiles: MAX_PHOTOS + 5, // Allow slightly higher threshold to catch and return clean 400
        maxFileSize: MAX_FILE_SIZE,
        allowEmptyFiles: false
    });

    form.parse(req, async (err, fields, files) => {
        const createdFiles = [];

        if (err) {
            if (err.code === 1016 || err.message?.includes('maxFileSize') || err.httpCode === 413) {
                return next(new AppError(`File size exceeds limit of 5MB per photo.`, 400));
            }
            if (err.code === 1015 || err.message?.includes('maxFiles')) {
                return next(new AppError(`Maximum of ${MAX_PHOTOS} photos allowed.`, 400));
            }
            return next(new AppError(`Error processing multipart form upload: ${err.message}`, 400));
        }

        try {
            // Flatten fields from formidable format
            const flattenedBody = {};
            for (const [key, value] of Object.entries(fields)) {
                if (Array.isArray(value)) {
                    flattenedBody[key] = value.length === 1 ? value[0] : value;
                } else {
                    flattenedBody[key] = value;
                }
            }
            req.body = { ...req.body, ...flattenedBody };

            // Collect all uploaded photo files
            const rawFiles = [];
            for (const [key, fileOrFiles] of Object.entries(files)) {
                if (Array.isArray(fileOrFiles)) {
                    rawFiles.push(...fileOrFiles);
                } else if (fileOrFiles) {
                    rawFiles.push(fileOrFiles);
                }
            }

            // Enforce server-side maximum photos limit
            if (rawFiles.length > MAX_PHOTOS) {
                for (const file of rawFiles) {
                    if (file.filepath && fs.existsSync(file.filepath)) {
                        await fs.promises.unlink(file.filepath).catch(() => {});
                    }
                }
                return next(new AppError(`Maximum of ${MAX_PHOTOS} photos allowed.`, 400));
            }

            const storedStorageKeys = [];

            for (const file of rawFiles) {
                if (!file.filepath || !fs.existsSync(file.filepath)) {
                    continue;
                }

                if (file.size > MAX_FILE_SIZE) {
                    throw new AppError(`Photo '${file.originalFilename || 'upload'}' exceeds maximum size of 5MB.`, 400);
                }

                // Verify file signature (magic bytes)
                const fd = await fs.promises.open(file.filepath, 'r');
                const buffer = Buffer.alloc(16);
                await fd.read(buffer, 0, 16, 0);
                await fd.close();

                const detectedExt = detectImageType(buffer);
                if (!detectedExt) {
                    throw new AppError(`File '${file.originalFilename || 'upload'}' is not a valid image. Only genuine JPG, PNG, and WEBP formats are accepted.`, 400);
                }

                // Safe server-side filename and storage key under dedicated prefix 'sell-your-phone/'
                const safeName = `sell_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${detectedExt}`;
                const destPath = path.join(UPLOAD_DIR, safeName);

                await fs.promises.copyFile(file.filepath, destPath);
                await fs.promises.unlink(file.filepath).catch(() => {});

                createdFiles.push(destPath);
                storedStorageKeys.push(`${STORAGE_PREFIX}/${safeName}`);
            }

            // Assign server-validated storage keys
            req.body.photos = storedStorageKeys;
            req.uploadedPhotoPaths = createdFiles;
            req.isServerValidatedUpload = true;

            return next();
        } catch (processError) {
            await cleanupFiles(createdFiles);
            return next(processError);
        }
    });
}

module.exports = {
    handleSellRequestUpload,
    cleanupFiles,
    detectImageType,
    MAX_PHOTOS,
    MAX_FILE_SIZE,
    STORAGE_PREFIX,
    UPLOAD_DIR
};
