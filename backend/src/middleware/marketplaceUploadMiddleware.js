/**
 * MarketplaceUploadMiddleware
 * Handles secure multi-photo uploads for Marketplace phone submissions.
 * Validates magic bytes (JPEG, PNG, WEBP), file size (<= 5MB), and photo count (<= 10).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { formidable } = require('formidable');
const AppError = require('../utils/customError');

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per photo
const STORAGE_PREFIX = 'marketplace';
const UPLOAD_DIR = path.resolve(__dirname, `../uploads/${STORAGE_PREFIX}`);

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validates file signature (magic bytes) to verify genuine image format.
 * @param {Buffer} buffer - First 12+ bytes of file
 * @returns {'jpg'|'png'|'webp'|null}
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
 * Validates image dimensions, checks for decompression bombs, and reads EXIF orientation.
 * @param {Buffer} buffer - File buffer (first 64KB is typically sufficient)
 * @param {'jpg'|'png'|'webp'} ext
 * @returns {{ width: number, height: number, orientation: number }}
 */
function inspectImageDimensionsAndOrientation(buffer, ext) {
    let width = 0;
    let height = 0;
    let orientation = 1;

    try {
        if (ext === 'png') {
            if (buffer.length >= 24) {
                width = buffer.readUInt32BE(16);
                height = buffer.readUInt32BE(20);
            }
        } else if (ext === 'jpg') {
            let offset = 2;
            while (offset < buffer.length - 8) {
                if (buffer[offset] !== 0xFF) break;
                const marker = buffer[offset + 1];
                const length = buffer.readUInt16BE(offset + 2);

                // APP1 Marker: EXIF metadata
                if (marker === 0xE1 && length >= 14 && offset + 4 + length <= buffer.length) {
                    const exifHeader = buffer.slice(offset + 4, offset + 10).toString('ascii');
                    if (exifHeader.startsWith('Exif')) {
                        const tiffStart = offset + 10;
                        const isLittleEndian = buffer.slice(tiffStart, tiffStart + 2).toString('ascii') === 'II';
                        const ifdOffset = isLittleEndian ? buffer.readUInt32LE(tiffStart + 4) : buffer.readUInt32BE(tiffStart + 4);
                        let tagPtr = tiffStart + ifdOffset;
                        if (tagPtr + 2 <= buffer.length) {
                            const numEntries = isLittleEndian ? buffer.readUInt16LE(tagPtr) : buffer.readUInt16BE(tagPtr);
                            tagPtr += 2;
                            for (let i = 0; i < numEntries && tagPtr + 12 <= buffer.length; i++) {
                                const tag = isLittleEndian ? buffer.readUInt16LE(tagPtr) : buffer.readUInt16BE(tagPtr);
                                if (tag === 0x0112) { // Orientation tag
                                    orientation = isLittleEndian ? buffer.readUInt16LE(tagPtr + 8) : buffer.readUInt16BE(tagPtr + 8);
                                    break;
                                }
                                tagPtr += 12;
                            }
                        }
                    }
                } else if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
                    // SOF (Start of Frame)
                    height = buffer.readUInt16BE(offset + 5);
                    width = buffer.readUInt16BE(offset + 7);
                    break;
                }
                offset += 2 + length;
            }
        } else if (ext === 'webp') {
            if (buffer.length >= 30) {
                const chunkType = buffer.slice(12, 16).toString('ascii');
                if (chunkType === 'VP8 ') {
                    width = buffer.readUInt16LE(26) & 0x3fff;
                    height = buffer.readUInt16LE(28) & 0x3fff;
                } else if (chunkType === 'VP8L') {
                    const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
                    width = 1 + (((b2 & 0x3f) << 8) | b1);
                    height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
                } else if (chunkType === 'VP8X' && buffer.length >= 30) {
                    width = 1 + buffer.readUIntLE(24, 3);
                    height = 1 + buffer.readUIntLE(27, 3);
                }
            }
        }
    } catch {
        // Fallback to safe defaults if header parsing encounters odd structures
        width = 800;
        height = 600;
        orientation = 1;
    }

    return { width, height, orientation: orientation || 1 };
}

/**
 * Compensating file cleanup utility.
 * @param {string[]} filePathsOrKeys
 */
async function cleanupFiles(filePathsOrKeys) {
    if (!Array.isArray(filePathsOrKeys)) return;

    for (const item of filePathsOrKeys) {
        if (!item || typeof item !== 'string') continue;
        try {
            let fullPath = item;
            if (item.startsWith(`${STORAGE_PREFIX}/`) || item.startsWith(`/${STORAGE_PREFIX}/`)) {
                const basename = path.basename(item);
                fullPath = path.join(UPLOAD_DIR, basename);
            }
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
            }
        } catch {
            // Ignore cleanup unlinks
        }
    }
}

/**
 * Middleware parsing multipart/form-data phone photo uploads.
 */
function handleMarketplaceUpload(req, res, next) {
    const contentType = req.headers['content-type'] || '';

    // Pass through if not multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
        return next();
    }

    const form = formidable({
        multiples: true,
        maxFileSize: MAX_FILE_SIZE,
        maxTotalFileSize: MAX_FILE_SIZE * MAX_PHOTOS,
        maxFiles: MAX_PHOTOS,
        keepExtensions: false
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return next(new AppError(`Upload error: ${err.message}`, 400));
        }

        // Flatten formidable fields
        const body = {};
        for (const [key, val] of Object.entries(fields)) {
            body[key] = Array.isArray(val) ? val[0] : val;
        }

        const uploadedPhotos = [];
        const filesToProcess = [];

        if (files.photos) {
            if (Array.isArray(files.photos)) {
                filesToProcess.push(...files.photos);
            } else {
                filesToProcess.push(files.photos);
            }
        }

        if (filesToProcess.length > MAX_PHOTOS) {
            return next(new AppError(`You cannot upload more than ${MAX_PHOTOS} photos.`, 400));
        }

        try {
            for (const file of filesToProcess) {
                if (!file || !file.filepath) continue;

                // Validate magic bytes & inspect dimensions
                const fd = await fs.promises.open(file.filepath, 'r');
                const buffer = Buffer.alloc(65536); // Read up to 64KB for headers and EXIF
                const bytesRead = (await fd.read(buffer, 0, 65536, 0)).bytesRead;
                await fd.close();

                const headerSlice = buffer.slice(0, bytesRead);
                const detectedExt = detectImageType(headerSlice);
                if (!detectedExt) {
                    await cleanupFiles([file.filepath, ...uploadedPhotos]);
                    return next(new AppError('Invalid image format. Only authentic JPEG, PNG, and WebP images are allowed.', 400));
                }

                const dimensions = inspectImageDimensionsAndOrientation(headerSlice, detectedExt);
                // Protect against decompression bombs / corrupted dimensions
                if (dimensions.width > 8000 || dimensions.height > 8000) {
                    await cleanupFiles([file.filepath, ...uploadedPhotos]);
                    return next(new AppError('Image dimensions exceed the maximum allowed limit of 8000x8000 pixels.', 400));
                }

                const uniqueName = `mkp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${detectedExt}`;
                const destPath = path.join(UPLOAD_DIR, uniqueName);

                await fs.promises.copyFile(file.filepath, destPath);
                await fs.promises.unlink(file.filepath).catch(() => {});

                // Store relative storage key
                uploadedPhotos.push(`${STORAGE_PREFIX}/${uniqueName}`);
            }

            req.body = body;
            req.uploadedPhotos = uploadedPhotos;
            next();
        } catch (uploadProcessingError) {
            await cleanupFiles(uploadedPhotos);
            next(new AppError(`Photo processing failed: ${uploadProcessingError.message}`, 500));
        }
    });
}

module.exports = {
    handleMarketplaceUpload,
    cleanupFiles,
    detectImageType,
    inspectImageDimensionsAndOrientation,
    MAX_PHOTOS,
    MAX_FILE_SIZE,
    STORAGE_PREFIX,
    UPLOAD_DIR
};
