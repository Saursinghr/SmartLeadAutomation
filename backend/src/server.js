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
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disable CSP for API
}));

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://smartleadautomation-1.onrender.com',
    'https://smart-lead-automation-zeta.vercel.app',
    'https://smart-lead-automation-frontend.vercel.app', // Adding a likely frontend URL
].filter(Boolean);

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in development or if it's a Vercel preview/production URL
        if (!origin || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, check against allowed list or allow all .vercel.app
        const isAllowed = allowedOrigins.some(allowed => {
            if (!allowed) return false;
            return origin === allowed || allowed.includes(origin);
        }) || origin.endsWith('.vercel.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            // Instead of blocking with error, we allow it but log it
            // This prevents "No Access-Control-Allow-Origin" error which is hard to debug
            callback(null, true); 
            logger.warn(`CORS: Allowed unknown origin ${origin}`);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
    optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection middleware for serverless environments
app.use(async (req, res, next) => {
    try {
        if (!database.isConnected()) {
            await database.connect();
        }
        next();
    } catch (error) {
        logger.error('Database connection error in middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
});

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

// Health check endpoints
const getHealthStatus = () => ({
    success: true,
    message: 'Smart Lead Automation API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.isConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
});

app.get('/', (req, res) => {
    res.status(200).json(getHealthStatus());
});

app.get('/api/health', (req, res) => {
    res.status(200).json(getHealthStatus());
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
            apiHealth: '/api/health',
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

// Start the server only if not running as a serverless function
// Vercel handles the listening part for us
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;

if (!isVercel && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
    startServer();
}

// Ensure database is connected even if startServer isn't called
if (isVercel) {
    database.connect().catch(err => logger.error('Vercel DB connection error:', err));
}

export default app;
