import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Database connection configuration with retry logic
 * Implements connection pooling and error handling for production use
 */
class Database {
  constructor() {
    this.connection = null;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    try {
      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);

      logger.info(`✅ MongoDB Connected: ${this.connection.connection.host}`);
      
      // Reset retry attempts on successful connection
      this.retryAttempts = 0;

      // Handle connection events
      this.setupEventHandlers();

      return this.connection;
    } catch (error) {
      logger.error(`❌ MongoDB Connection Error: ${error.message}`);
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        logger.info(`🔄 Retrying connection (${this.retryAttempts}/${this.maxRetries}) in ${this.retryDelay / 1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        logger.error('❌ Max retry attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  /**
   * Setup MongoDB connection event handlers
   */
  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      logger.info('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Gracefully disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('👋 MongoDB connection closed through app termination');
    } catch (error) {
      logger.error(`❌ Error closing MongoDB connection: ${error.message}`);
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();
