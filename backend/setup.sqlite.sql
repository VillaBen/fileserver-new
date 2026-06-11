-- ============================================================
-- FileCloud 文件管理系统 - SQLite 初始化脚本
-- 适用于 SQLite 3.x 及以上版本
-- 使用方法:
--   sqlite3 database/fileserver.db < setup.sqlite.sql
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. 用户账户表
-- ============================================================
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
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- ============================================================
-- 2. 用户配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL UNIQUE,
    storage_quota INTEGER NOT NULL DEFAULT 10737418240,
    language TEXT NOT NULL DEFAULT 'zh-CN',
    display_name TEXT,
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
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_account ON user_profiles(account_id);

-- ============================================================
-- 3. API Token 表
-- ============================================================
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
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_account ON api_tokens(account_id);

-- ============================================================
-- 4. 文件表
-- ============================================================
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
    security_status TEXT DEFAULT 'unknown',
    scan_mode TEXT,
    scan_result TEXT,
    scan_at DATETIME,
    deleted_at DATETIME,
    type TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);

-- ============================================================
-- 5. 分享表
-- ============================================================
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
);

CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(share_code);
CREATE INDEX IF NOT EXISTS idx_shares_account ON shares(account_id);

-- ============================================================
-- 6. 审计日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_account ON audit_logs(account_id);

-- ============================================================
-- 7. 恢复码表
-- ============================================================
CREATE TABLE IF NOT EXISTS recovery_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    used_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recovery_account ON recovery_codes(account_id);

-- ============================================================
-- 8. 邮件验证码表
-- ============================================================
CREATE TABLE IF NOT EXISTS email_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email);

-- ============================================================
-- 9. 密码重置表
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_account ON password_resets(account_id);

-- ============================================================
-- 10. 系统设置表
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. 信任设备表
-- ============================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    device_name TEXT,
    device_type TEXT,
    user_agent TEXT,
    ip_address TEXT,
    location TEXT,
    token TEXT UNIQUE NOT NULL,
    last_login_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_account ON trusted_devices(account_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_token ON trusted_devices(token);

-- ============================================================
-- 12. 通知表
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_account ON notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================
-- 13. 播放列表表
-- ============================================================
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    item_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlists_account ON playlists(account_id);

-- ============================================================
-- 14. 播放列表项表
-- ============================================================
CREATE TABLE IF NOT EXISTS playlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_file ON playlist_items(file_id);

-- ============================================================
-- 初始化完成
-- ============================================================
INSERT INTO system_settings (key, value) VALUES ('db_version', '1.0');

SELECT '数据库初始化完成' AS message;
