
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const conn = await mysql.createConnection({
    socketPath: '/tmp/mysql.sock',
    user: 'root',
    database: 'fileserver'
  });
  
  console.log('Connected');
  
  const sql = [
    'SET FOREIGN_KEY_CHECKS = 0',
    'DROP TABLE IF EXISTS system_settings',
    'DROP TABLE IF EXISTS password_resets',
    'DROP TABLE IF EXISTS email_codes',
    'DROP TABLE IF EXISTS recovery_codes',
    'DROP TABLE IF EXISTS audit_logs',
    'DROP TABLE IF EXISTS shares',
    'DROP TABLE IF EXISTS files',
    'DROP TABLE IF EXISTS api_tokens',
    'DROP TABLE IF EXISTS user_profiles',
    'DROP TABLE IF EXISTS accounts',
    'SET FOREIGN_KEY_CHECKS = 1',
    
    'CREATE TABLE accounts (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'username VARCHAR(255) UNIQUE NOT NULL,' +
    'email VARCHAR(255) UNIQUE,' +
    'password_hash VARCHAR(255) NOT NULL,' +
    'role VARCHAR(50) NOT NULL DEFAULT "user",' +
    'status TINYINT NOT NULL DEFAULT 1,' +
    'storage_quota BIGINT NOT NULL DEFAULT 10737418240,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE user_profiles (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT NOT NULL UNIQUE,' +
    'storage_quota BIGINT NOT NULL DEFAULT 10737418240,' +
    'language VARCHAR(20) NOT NULL DEFAULT "zh-CN",' +
    'email_verified TINYINT NOT NULL DEFAULT 0,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE files (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT NOT NULL,' +
    'original_name VARCHAR(255) NOT NULL,' +
    'filename VARCHAR(255) NOT NULL UNIQUE,' +
    'filepath TEXT NOT NULL,' +
    'size BIGINT NOT NULL,' +
    'mime_type VARCHAR(255),' +
    'folder_id BIGINT,' +
    'in_trash TINYINT NOT NULL DEFAULT 0,' +
    'is_encrypted TINYINT NOT NULL DEFAULT 1,' +
    'file_hash VARCHAR(255),' +
    'security_status VARCHAR(50) DEFAULT "unknown",' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE api_tokens (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT NOT NULL,' +
    'token VARCHAR(255) UNIQUE NOT NULL,' +
    'name VARCHAR(255) NOT NULL,' +
    'permissions TEXT,' +
    'created_at DATETIME DEFAULT CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE shares (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'file_id BIGINT NOT NULL,' +
    'account_id BIGINT NOT NULL,' +
    'share_code VARCHAR(255) NOT NULL UNIQUE,' +
    'password_hash VARCHAR(255),' +
    'download_count INT NOT NULL DEFAULT 0,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE audit_logs (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT,' +
    'action VARCHAR(255) NOT NULL,' +
    'ip_address VARCHAR(255),' +
    'details TEXT,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE recovery_codes (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT NOT NULL,' +
    'code VARCHAR(255) NOT NULL,' +
    'used TINYINT NOT NULL DEFAULT 0,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE email_codes (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'email VARCHAR(255) NOT NULL,' +
    'purpose VARCHAR(255) NOT NULL,' +
    'code VARCHAR(255) NOT NULL,' +
    'expires_at DATETIME NOT NULL,' +
    'attempts INT NOT NULL DEFAULT 0,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE password_resets (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'account_id BIGINT NOT NULL,' +
    'token VARCHAR(255) NOT NULL,' +
    'expires_at DATETIME NOT NULL,' +
    'used TINYINT NOT NULL DEFAULT 0,' +
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
    'FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    
    'CREATE TABLE system_settings (' +
    'id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    '`key` VARCHAR(255) UNIQUE NOT NULL,' +
    'value TEXT,' +
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  ];
  
  for (let i = 0; i &lt; sql.length; i++) {
    await conn.execute(sql[i]);
  }
  
  console.log('Tables created');
  
  const passHash = await bcrypt.hash('admin123', 10);
  await conn.execute(
    'INSERT INTO accounts (username, email, password_hash, role, status, storage_quota) VALUES (?, ?, ?, ?, ?, ?)',
    ['admin', 'admin@example.com', passHash, 'admin', 1, 107374182400]
  );
  
  await conn.execute(
    'INSERT INTO user_profiles (account_id, storage_quota, language, email_verified) VALUES (?, ?, ?, ?)',
    [1, 107374182400, 'zh-CN', 1]
  );
  
  console.log('Test user: admin / admin123');
  console.log('Done!');
  
  await conn.end();
}

run().catch(function(e) {
  console.error(e);
  process.exit(1);
});

