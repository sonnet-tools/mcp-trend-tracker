#!/usr/bin/env node

const express = require('express');
const cron = require('node-cron');
const winston = require('winston');
require('dotenv').config();

const { initDatabase } = require('./database/init');
const { startScrapers } = require('./scrapers');
const { generateTrendReport } = require('./analytics/trend-analyzer');
const { setupRoutes } = require('./routes');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize application
async function init() {
  try {
    logger.info('🚀 Starting MCP Trend Tracker...');
    
    // Initialize database
    await initDatabase();
    logger.info('📊 Database initialized');
    
    // Setup API routes
    setupRoutes(app);
    logger.info('🛣️  Routes configured');
    
    // Start data collection (every 6 hours)
    cron.schedule('0 */6 * * *', async () => {
      logger.info('🔄 Starting scheduled data collection');
      await startScrapers();
    });
    
    // Generate daily trend reports (every day at 9 AM)
    cron.schedule('0 9 * * *', async () => {
      logger.info('📈 Generating daily trend report');
      await generateTrendReport();
    });
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🌐 Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the application
init();