/**
 * 数据库配置 - SQLite
 * 重新设计的简洁架构
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../database/fileserver.db');

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 已连接到 SQLite 数据库');
  }
});

// Promise 包装方法
db.asyncRun = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.asyncGet = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

db.asyncAll = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

/**
 * 初始化数据库表结构
 */
async function initDatabase() {
  console.log('📦 正在初始化数据库...');

  // 用户账户表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status INTEGER NOT NULL DEFAULT 1,
      storage_quota INTEGER NOT NULL DEFAULT 10737418240,
      avatar TEXT,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户配置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL UNIQUE,
      storage_quota INTEGER NOT NULL DEFAULT 10737418240,
      language TEXT NOT NULL DEFAULT 'zh-CN',
      avatar TEXT,
      security_question TEXT,
      security_answer_hash TEXT,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      email_verification_token TEXT,
      email_reminder_disabled INTEGER NOT NULL DEFAULT 0,
      trash_auto_delete_enabled INTEGER NOT NULL DEFAULT 0,
      trash_auto_delete_days INTEGER,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 为已有表添加新列（如果不存在）
  try {
    await db.asyncRun('ALTER TABLE user_profiles ADD COLUMN trash_auto_delete_enabled INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    // 列可能已存在，忽略错误
  }

  try {
    await db.asyncRun('ALTER TABLE user_profiles ADD COLUMN trash_auto_delete_days INTEGER');
  } catch (e) {
    // 列可能已存在，忽略错误
  }

  // API Token表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT,
      last_used_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 文件表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      filename TEXT NOT NULL UNIQUE,
      filepath TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT,
      folder_id INTEGER,
      in_trash INTEGER NOT NULL DEFAULT 0,
      is_encrypted INTEGER NOT NULL DEFAULT 1,
      file_hash TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 分享表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      share_code TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      expires_at DATETIME,
      max_downloads INTEGER,
      download_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 审计日志表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `);

  // 恢复码表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS recovery_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 邮件验证码表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS email_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 密码重置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // 系统设置表
  await db.asyncRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_user_profiles_account ON user_profiles(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_api_tokens_account ON api_tokens(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(share_code)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_shares_account ON shares(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_audit_account ON audit_logs(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_recovery_account ON recovery_codes(account_id)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email)');
  await db.asyncRun('CREATE INDEX IF NOT EXISTS idx_reset_account ON password_resets(account_id)');

  console.log('✅ 数据库初始化完成');
}

module.exports = {
  db,
  initDatabase
};
