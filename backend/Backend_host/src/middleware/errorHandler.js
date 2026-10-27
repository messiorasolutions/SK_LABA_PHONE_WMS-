/**
 * Centralized error handling middleware
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // Handle JSON syntax parse error from express.json()
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload received.'
        });
    }

    // Handle MySQL Duplicate Entry (UNIQUE constraints)
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        return res.status(409).json({
            success: false,
            message: 'A record with this unique value already exists in the database.'
        });
    }

    // Handle MySQL Foreign Key Constraint (cannot delete referenced row)
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        return res.status(409).json({
            success: false,
            message: 'Cannot delete this record because it is referenced by other items (e.g. phones).'
        });
    }

    // Handle MySQL CHECK Constraint Violation
    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
        return res.status(400).json({
            success: false,
            message: 'A database validation check failed for one of the values provided.'
        });
    }

    // Handle AppError (custom operational errors)
    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }

    // Log genuinely unexpected errors
    console.error('Unhandled Error:', err);

    // Default internal server error
    return res.status(500).json({
        success: false,
        message: 'Internal server error occurred.'
    });
}

module.exports = errorHandler;
