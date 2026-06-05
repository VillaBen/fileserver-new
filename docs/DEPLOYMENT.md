
# 部署指南

## 生产环境部署

### 前置要求

- Node.js 18+
- npm 9+

---

## 部署步骤

### 1. 环境准备

```bash
# 安装 Node.js (如果未安装)
# 参考: https://nodejs.org/
```

### 2. 项目准备

```bash
# 克隆或上传项目
cd /var/www
git clone &lt;your-repo&gt; fileserver
cd fileserver

# 安装后端依赖
cd backend
npm install --production
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改密钥
```

**关键配置**:

```env
PORT=3000
NODE_ENV=production

# 加密密钥 (必须修改)
ENCRYPTION_KEY=your-32-byte-encryption-key-change-this

# JWT 密钥 (必须修改)
JWT_SECRET=your-super-secret-jwt-key-change-this

# 数据库
DB_PATH=./database/fileserver.db

# 上传
UPLOAD_DIR=./uploads
```

### 4. 初始化数据库

数据库会在首次启动时自动初始化。

### 5. 启动应用

#### 方式 1: 直接启动

```bash
cd backend
npm start
```

#### 方式 2: 使用 PM2 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name fileserver-backend

# 配置开机自启
pm2 startup
pm2 save
```

---

## 目录权限

```bash
cd /var/www/fileserver/backend
mkdir -p uploads database
chmod 755 uploads database
```

---

## 安全建议

### 环境变量

- 确保修改所有默认密钥
- 不要将 `.env` 提交到版本控制

### 备份

定期备份数据库和上传文件：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/fileserver"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /var/www/fileserver/backend/database/fileserver.db $BACKUP_DIR/fileserver_$DATE.db
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/fileserver/backend uploads
```

---

## 相关文档

- [开发指南](DEVELOPMENT.md)
- [API 文档](API.md)
- [数据库设计](DATABASE.md)

