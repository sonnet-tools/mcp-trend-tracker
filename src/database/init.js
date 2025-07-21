const { Database } = require('./index');
const logger = require('../utils/logger');

async function initDatabase() {
  try {
    const db = new Database();
    await db.init();
    logger.info('Database initialized successfully');
    await db.close();
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

module.exports = { initDatabase };