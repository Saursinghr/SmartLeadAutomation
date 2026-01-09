import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import database from './config/database.js';
import leadRoutes from './routes/lead.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import crmSyncJob from './jobs/crmSync.job.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// Middleware Configuration
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://smartleadautomation-1.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Lead Automation API is running',
        timestamp: new Date().toISOString(),
        database: database.isConnected() ? 'connected' : 'disconnected',
    });
});

// API routes
app.use('/api/leads', leadRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Smart Lead Automation API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            processLeads: 'POST /api/leads/process',
            getLeads: 'GET /api/leads',
            getStats: 'GET /api/leads/stats',
            getLead: 'GET /api/leads/:id',
        },
    });
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Server Initialization
// ============================================================================

/**
 * Start the server
 */
async function startServer() {
    try {
        // Connect to database
        await database.connect();

        // Start the server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 API URL: http://localhost:${PORT}`);
        });

        // Start background jobs
        crmSyncJob.start();

        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`\n${signal} received. Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async () => {
                logger.info('✅ HTTP server closed');

                // Stop background jobs
                crmSyncJob.stop();

                // Close database connection
                await database.disconnect();

                logger.info('👋 Graceful shutdown completed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('❌ Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

export default app;
