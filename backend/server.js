/**
 * FileCloud 后端主服务器
 * 重新设计的简洁架构
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const { initDatabase } = require('./src/config/database');
const apiResponseHandler = require('./src/middleware/response');
const errorHandler = require('./src/middleware/error');
const { requireAuth, requireAdmin } = require('./src/middleware/auth');
const { setupRoutes } = require('./src/routes');
const { initClamAV } = require('./src/middleware/malwareScanner');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API响应中间件
app.use('/api', apiResponseHandler);

// 设置路由
setupRoutes(app);

// CSRF Token
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(16).toString('hex');
  res.apiSuccess({ csrfToken: token });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.apiSuccess({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 创建上传目录
    const fs = require('fs');
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ 上传目录已创建');
    }

    // 初始化 ClamAV（总是尝试）
    console.log('🔍 正在初始化 ClamAV...');
    await initClamAV();

    // 获取扫描模式
    const scanMode = process.env.MALWARE_SCAN_MODE || 'file-header';

    // 监听端口
    app.listen(PORT, () => {
      console.log(`🎉 FileCloud 服务器已启动: http://localhost:${PORT}`);
      console.log(`📁 API地址: http://localhost:${PORT}/api`);
      console.log(`🛡️  恶意文件检测模式: ${scanMode}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
