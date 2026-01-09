import { validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

/**
 * Middleware to validate request using express-validator
 * Returns 400 with validation errors if validation fails
 */
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        logger.warn('Validation failed:', errors.array());

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value,
            })),
        });
    }

    next();
};
