
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS email_codes;
DROP TABLE IF EXISTS recovery_codes;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS accounts;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE accounts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE files (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_tokens (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shares (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(255),
  user_agent TEXT,
  details TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recovery_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  code VARCHAR(255) NOT NULL,
  used TINYINT NOT NULL DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_resets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

