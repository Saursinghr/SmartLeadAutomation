/**
 * Logger utility for consistent logging across the application
 * Provides formatted console output with timestamps and log levels
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    RESET: '\x1b[0m',
};

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    }

    /**
     * Format log message with timestamp and level
     */
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        const color = COLORS[level] || COLORS.RESET;
        return `${color}[${timestamp}] [${level}]${COLORS.RESET} ${message}`;
    }

    /**
     * Log error messages
     */
    error(message, error = null) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message));
        if (error && error.stack) {
            console.error(error.stack);
        }
    }

    /**
     * Log warning messages
     */
    warn(message) {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            console.warn(this.formatMessage(LOG_LEVELS.WARN, message));
        }
    }

    /**
     * Log info messages
     */
    info(message) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatMessage(LOG_LEVELS.INFO, message));
        }
    }

    /**
     * Log debug messages
     */
    debug(message) {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatMessage(LOG_LEVELS.DEBUG, message));
        }
    }

    /**
     * Check if message should be logged based on log level
     */
    shouldLog(level) {
        const levels = Object.keys(LOG_LEVELS);
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }

    /**
     * Log CRM sync activity (special formatting for assignment requirement)
     */
    crmSync(leadName) {
        console.log(`${COLORS.INFO}[CRM Sync]${COLORS.RESET} Sending verified lead ${leadName} to Sales Team...`);
    }
}

export const logger = new Logger();
