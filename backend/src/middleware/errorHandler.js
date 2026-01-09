import { logger } from '../utils/logger.js';

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error caught by error handler:', err);

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.name === 'MongoServerError' && err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err,
        }),
    });
};

/**
 * 404 Not Found handler
 * Catches all requests to undefined routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
};
