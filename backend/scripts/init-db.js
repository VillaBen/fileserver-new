#!/usr/bin/env node
// scripts/init-db.js
require('dotenv').config();
const { initDatabase } = require('../src/config/database.adapter');
const logger = require('../src/utils/logger');

async function main() {
  try {
    await initDatabase();
    logger.info('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();
