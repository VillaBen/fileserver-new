
# 数据库设计文档

## 概述

- **数据库类型**: SQLite 3
- **数据库文件**: `database/fileserver.db`
- **字符编码**: UTF-8

## 表结构

### accounts - 账户表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 账户 ID |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| email | TEXT | UNIQUE | 邮箱（加密存储） |
| password_hash | TEXT | NOT NULL | 密码哈希 (bcrypt) |
| role | TEXT | NOT NULL DEFAULT 'user' | 角色: 'user' / 'admin' |
| status | INTEGER | NOT NULL DEFAULT 1 | 状态: 1=正常, 0=禁用 |
| storage_quota | INTEGER | NOT NULL DEFAULT 10737418240 | 存储配额 (字节) |
| avatar | TEXT | NULL | 头像 |
| two_factor_enabled | INTEGER | NOT NULL DEFAULT 0 | 双因素认证是否启用 |
| two_factor_secret | TEXT | NULL | 双因素认证密钥（加密） |
| failed_login_attempts | INTEGER | NOT NULL DEFAULT 0 | 登录失败次数 |
| locked_until | DATETIME | NULL | 锁定结束时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:

- `idx_accounts_username` - 用户名索引
- `idx_accounts_email` - 邮箱索引

---

### user_profiles - 用户配置表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | ID |
| account_id | INTEGER | NOT NULL UNIQUE | 关联账户 ID |
| storage_quota | INTEGER | NOT NULL DEFAULT 10737418240 | 存储配额 (字节) |
| language | TEXT | NOT NULL DEFAULT 'zh-CN' | 语言 |
| avatar | TEXT | NULL | 头像 |
| security_question | TEXT | NULL | 安全问题 |
| security_answer_hash | TEXT | NULL | 安全问题答案哈希 (bcrypt) |
| two_factor_enabled | INTEGER | NOT NULL DEFAULT 0 | 双因素认证是否启用 |
| two_factor_secret | TEXT | NULL | 双因素认证密钥（加密） |
| email_verified | INTEGER | NOT NULL DEFAULT 0 | 邮箱是否已验证 |
| email_verification_token | TEXT | NULL | 邮箱验证令牌（加密） |
| email_reminder_disabled | INTEGER | NOT NULL DEFAULT 0 | 是否禁用邮件提醒 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)

---

### api_tokens - API Token 表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Token ID |
| account_id | INTEGER | NOT NULL | 关联账户 ID |
| token | TEXT | NOT NULL | Token（加密存储） |
| name | TEXT | NOT NULL | Token 名称 |
| permissions | TEXT | NULL | 权限配置 (JSON) |
| last_used_at | DATETIME | NULL | 最后使用时间 |
| expires_at | DATETIME | NULL | 过期时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_api_tokens_account` - 账户索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)

---

### files - 文件表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 文件 ID |
| account_id | INTEGER | NOT NULL | 所属账户 ID |
| original_name | TEXT | NOT NULL | 原始文件名 |
| filename | TEXT | NOT NULL | 加密存储文件名 |
| filepath | TEXT | NOT NULL | 文件存储路径 |
| size | INTEGER | NOT NULL | 文件大小 (字节) |
| mime_type | TEXT | NULL | MIME 类型 |
| folder_id | INTEGER | NULL | 文件夹 ID |
| in_trash | INTEGER | NOT NULL DEFAULT 0 | 是否在回收站 |
| is_encrypted | INTEGER | NOT NULL DEFAULT 1 | 是否已加密 |
| file_hash | TEXT | NULL | 文件 SHA-256 哈希 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**:

- `idx_files_account` - 账户索引
- `idx_files_folder` - 文件夹索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)

---

### shares - 分享表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 分享 ID |
| file_id | INTEGER | NOT NULL | 被分享的文件 ID |
| account_id | INTEGER | NOT NULL | 创建分享的账户 ID |
| share_code | TEXT | NOT NULL UNIQUE | 分享唯一代码 |
| password_hash | TEXT | NULL | 访问密码哈希 (bcrypt) |
| expires_at | DATETIME | NULL | 过期时间 |
| max_downloads | INTEGER | NULL | 最大下载次数 |
| download_count | INTEGER | NOT NULL DEFAULT 0 | 当前下载次数 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_shares_code` - 分享代码索引
- `idx_shares_account` - 账户索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)
- `file_id` → `files.id` (ON DELETE CASCADE)

---

### audit_logs - 审计日志表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 日志 ID |
| account_id | INTEGER | NULL | 关联账户 ID |
| action | TEXT | NOT NULL | 操作类型 |
| ip_address | TEXT | NULL | 客户端 IP |
| user_agent | TEXT | NULL | 用户代理 |
| details | TEXT | NULL | 操作详情 (JSON) |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_audit_account` - 账户索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE SET NULL)

---

### recovery_codes - 恢复码表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | ID |
| account_id | INTEGER | NOT NULL | 关联账户 ID |
| code | TEXT | NOT NULL | 恢复码（加密存储） |
| used | INTEGER | NOT NULL DEFAULT 0 | 是否已使用 |
| used_at | DATETIME | NULL | 使用时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_recovery_account` - 账户索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)

---

### email_codes - 邮箱验证码表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | ID |
| email | TEXT | NOT NULL | 邮箱地址（加密存储） |
| purpose | TEXT | NOT NULL | 用途 |
| code | TEXT | NOT NULL | 验证码（加密存储） |
| expires_at | DATETIME | NOT NULL | 过期时间 |
| attempts | INTEGER | NOT NULL DEFAULT 0 | 尝试次数 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_email_codes_email` - 邮箱索引

---

### password_resets - 密码重置表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | ID |
| account_id | INTEGER | NOT NULL | 关联账户 ID |
| token | TEXT | NOT NULL | 重置令牌（加密存储） |
| expires_at | DATETIME | NOT NULL | 过期时间 |
| used | INTEGER | NOT NULL DEFAULT 0 | 是否已使用 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**:

- `idx_reset_account` - 账户索引

**外键**:

- `account_id` → `accounts.id` (ON DELETE CASCADE)

---

### system_settings - 系统设置表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | ID |
| key | TEXT | UNIQUE NOT NULL | 设置键 |
| value | TEXT | NULL | 设置值 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新时间 |

---

## 加密说明

### 对称加密 (AES-256-CBC)

以下字段使用 AES-256-CBC 加密存储：

- `accounts.email` - 邮箱地址
- `accounts.two_factor_secret` - 双因素认证密钥
- `user_profiles.two_factor_secret` - 双因素认证密钥
- `user_profiles.email_verification_token` - 邮箱验证令牌
- `api_tokens.token` - API Token
- `recovery_codes.code` - 恢复码
- `email_codes.email` - 邮箱地址
- `email_codes.code` - 验证码
- `password_resets.token` - 密码重置令牌

### 单向哈希 (bcrypt)

以下字段使用 bcrypt 哈希存储（不可解密）：

- `accounts.password_hash` - 用户密码
- `user_profiles.security_answer_hash` - 安全问题答案
- `shares.password_hash` - 分享访问密码

### 文件加密

- 上传的文件使用 AES-256-CBC 加密存储在文件系统中
- 文件后缀为 `.enc`
- `files.is_encrypted` 字段标记文件是否加密
- `files.file_hash` 存储文件的 SHA-256 哈希值用于完整性验证

---

## 初始化

数据库初始化在 `backend/src/config/database.js` 中自动完成。

