
/**
 * 数据库配置 - MySQL
 * 支持 MySQL 数据库连接
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 连接配置
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fileserver',
  socketPath: process.env.MYSQL_SOCKET || undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
  charset: 'utf8mb4',
  multipleStatements: true
};

// 创建连接池
const pool = mysql.createPool(MYSQL_CONFIG);

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 已连接到 MySQL 数据库');
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL 数据库连接失败:', err.message);
    return false;
  }
}

// 数据库操作方法封装
const db = {
  // 查询单条记录
  asyncGet: async function(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  // 查询多条记录
  asyncAll: async function(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // 执行 SQL（INSERT/UPDATE/DELETE）
  asyncRun: async function(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  },

  // 开始事务
  async beginTransaction() {
    return pool.getConnection();
  },

  // 提交事务
  async commit(connection) {
    await connection.commit();
    connection.release();
  },

  // 回滚事务
  async rollback(connection) {
    await connection.rollback();
    connection.release();
  },

  // 获取连接
  async getConnection() {
    return pool.getConnection();
  }
};

/**
 * 初始化 MySQL 数据库表结构
 */
async function initDatabase() {
  console.log('📦 正在初始化 MySQL 数据库...');

  // 用户账户表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS accounts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      status TINYINT NOT NULL DEFAULT 1,
      storage_quota BIGINT NOT NULL DEFAULT 10737418240,
      avatar TEXT,
      two_factor_enabled TINYINT NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      failed_login_attempts INT NOT NULL DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 用户配置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT NOT NULL UNIQUE,
      storage_quota BIGINT NOT NULL DEFAULT 10737418240,
      language VARCHAR(20) NOT NULL DEFAULT 'zh-CN',
      avatar TEXT,
      security_question TEXT,
      security_answer_hash TEXT,
      two_factor_enabled TINYINT NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      email_verified TINYINT NOT NULL DEFAULT 0,
      email_verification_token TEXT,
      email_reminder_disabled TINYINT NOT NULL DEFAULT 0,
      trash_auto_delete_enabled TINYINT NOT NULL DEFAULT 0,
      trash_auto_delete_days INT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // API Token表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      permissions TEXT,
      last_used_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 文件表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS files (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL UNIQUE,
      filepath TEXT NOT NULL,
      size BIGINT NOT NULL,
      mime_type VARCHAR(255),
      folder_id BIGINT,
      in_trash TINYINT NOT NULL DEFAULT 0,
      is_encrypted TINYINT NOT NULL DEFAULT 1,
      file_hash VARCHAR(255),
      security_status VARCHAR(50) DEFAULT 'unknown',
      scan_mode VARCHAR(50),
      scan_result TEXT,
      scan_at DATETIME,
      deleted_at DATETIME,
      type VARCHAR(50),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_account_id (account_id),
      INDEX idx_folder_id (folder_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 分享表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS shares (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      file_id BIGINT NOT NULL,
      account_id BIGINT NOT NULL,
      share_code VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255),
      expires_at DATETIME,
      max_downloads INT,
      download_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_share_code (share_code),
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 审计日志表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT,
      action VARCHAR(255) NOT NULL,
      ip_address VARCHAR(255),
      user_agent TEXT,
      details TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 恢复码表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS recovery_codes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT NOT NULL,
      code VARCHAR(255) NOT NULL,
      used TINYINT NOT NULL DEFAULT 0,
      used_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 邮件验证码表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS email_codes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      purpose VARCHAR(255) NOT NULL,
      code VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 密码重置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      account_id BIGINT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      INDEX idx_account_id (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 系统设置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      \`key\` VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ MySQL 数据库初始化完成');
}

module.exports = {
  db,
  pool,
  initDatabase,
  testConnection
};

