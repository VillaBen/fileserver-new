# MySQL 数据库迁移指南

## 📋 概述

本指南将帮助你从 SQLite 数据库迁移到 MySQL 数据库。

## 🚀 快速开始

### 1. 确保 MySQL 已安装并运行

检查 MySQL 是否安装：
```bash
mysql --version
```

### 2. 创建 MySQL 数据库

```sql
CREATE DATABASE fileserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并更新以下配置：

```env
# 数据库类型: sqlite (默认) 或 mysql
DB_TYPE=mysql

# MySQL 配置
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=fileserver
```

### 4. 迁移数据（从 SQLite 到 MySQL）

如果你已经有 SQLite 数据库的数据，可以运行迁移脚本：

```bash
cd backend
npm run db:migrate:sqlite-to-mysql
```

这个脚本会：
- 测试 MySQL 连接
- 创建 MySQL 表结构
- 从 SQLite 读取所有数据
- 将数据写入 MySQL
- 显示迁移统计

### 5. 初始化新数据库（全新安装）

如果是全新安装，直接运行：

```bash
cd backend
npm run db:init
```

### 6. 启动服务器

```bash
npm start
```

## 📁 文件结构

### 新增的文件

```
backend/
├── src/
│   └── config/
│       ├── database.adapter.js  # 数据库适配器（统一接口）
│       └── database.mysql.js     # MySQL 数据库配置
├── scripts/
│   └── migrate-sqlite-to-mysql.js  # SQLite 到 MySQL 迁移脚本
└── .env.example  # 更新了 MySQL 配置示例
```

## 🔧 数据库适配器

项目现在使用统一的数据库适配器，支持两种数据库：

```javascript
// 使用方式保持不变
const { db, initDatabase } = require('./src/config/database.adapter');

// 查询单条记录
const user = await db.asyncGet('SELECT * FROM accounts WHERE id = ?', [1]);

// 查询多条记录
const files = await db.asyncAll('SELECT * FROM files WHERE account_id = ?', [1]);

// 执行 SQL
await db.asyncRun('INSERT INTO accounts (username, password_hash) VALUES (?, ?)', ['user', 'hash']);
```

## 📊 表结构对比

| 功能 | SQLite | MySQL |
|------|--------|-------|
| 自增主键 | INTEGER PRIMARY KEY AUTOINCREMENT | BIGINT PRIMARY KEY AUTO_INCREMENT |
| 时间戳 | DATETIME DEFAULT CURRENT_TIMESTAMP | DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| 字符集 | 默认 UTF-8 | utf8mb4_unicode_ci（支持 emoji） |
| 外键约束 | 支持 | 支持 |
| 索引 | 支持 | 支持 |

## 🔐 安全建议

1. **不要使用 root 用户**：创建专门的数据库用户
2. **使用强密码**：为 MySQL 用户设置强密码
3. **限制权限**：只授予必要的数据库权限
4. **备份数据**：迁移前先备份 SQLite 数据库
5. **测试迁移**：在开发环境先测试迁移流程

## 💡 常见问题

### Q: 如何切换回 SQLite？

A: 在 `.env` 文件中设置：
```env
DB_TYPE=sqlite
```

### Q: 迁移时出现连接错误？

A: 检查以下几点：
- MySQL 服务是否运行
- 主机地址、端口是否正确
- 用户名密码是否正确
- 数据库是否已创建
- 防火墙设置

### Q: 数据迁移不完整？

A: 
- 确保在迁移前没有新数据写入
- 检查迁移脚本输出的统计信息
- 对比迁移前后的数据量

### Q: 性能差异？

A: 
- MySQL 在高并发场景下性能更好
- SQLite 适合小型应用和开发环境
- 对于大多数文件服务器场景，两者都够用

## 📝 迁移检查清单

- [ ] 备份 SQLite 数据库文件
- [ ] 安装并启动 MySQL
- [ ] 创建数据库和用户
- [ ] 更新 .env 配置
- [ ] 运行迁移脚本
- [ ] 验证数据完整性
- [ ] 测试应用功能
- [ ] 备份新的 MySQL 数据库

## 🆘 需要帮助？

如遇到问题，请检查：
1. 控制台错误日志
2. MySQL 错误日志
3. 确保所有依赖已安装 `npm install`

