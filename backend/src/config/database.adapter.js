
/**
 * 数据库适配器 - 统一接口
 * 支持 SQLite 和 MySQL 双数据库配置
 */

require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let dbAdapter;
let initDatabase;

if (DB_TYPE === 'mysql') {
  console.log('🗄️ 使用 MySQL 数据库');
  const mysqlDb = require('./database.mysql');
  dbAdapter = mysqlDb.db;
  initDatabase = mysqlDb.initDatabase;
} else {
  console.log('🗄️ 使用 SQLite 数据库');
  const sqliteDb = require('./database');
  dbAdapter = sqliteDb.db;
  initDatabase = sqliteDb.initDatabase;
}

module.exports = {
  db: dbAdapter,
  initDatabase,
  DB_TYPE
};

