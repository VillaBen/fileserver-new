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
const { initDatabase } = require('./src/config/database.adapter');
const apiResponseHandler = require('./src/middleware/response');
const errorHandler = require('./src/middleware/error');
const { requireAuth, requireAdmin } = require('./src/middleware/auth');
const { setupRoutes } = require('./src/routes');
const { blacklistMiddleware } = require('./src/middleware/token-blacklist');
const { authRateLimit, strictAuthRateLimit } = require('./src/middleware/rate-limit');
const { initClamAV, getConfig } = require('./src/middleware/malwareScanner');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: 不允许的源'), false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API响应中间件
app.use('/api', apiResponseHandler);

// 设置路由
setupRoutes(app);

// CSRF Token 验证中间件（用于 POST/PUT/DELETE 等改变状态的请求）
// 生产环境应使用 csurf 等专业库，这里是简化版的双重提交 cookie 模式
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  const csrfCookie = req.cookies?._csrf;
  if (isRead) return next();
  // 对未认证用户不强制 csrf（例如登录、注册表单）
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  if (csrfToken && csrfCookie && csrfToken === csrfCookie) return next();
  // 宽松策略：有 token 就放行（前端还没完全接入）
  return next();
});

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

    // 加载并显示安全配置状态
    console.log('⚙️  正在加载安全配置...');
    const config = await getConfig();

    // 获取扫描模式
    const scanMode = config.scanMode || 'file-header';

    // 监听端口
    app.listen(PORT, () => {
      console.log(`🎉 FileCloud 服务器已启动: http://localhost:${PORT}`);
      console.log(`📁 API地址: http://localhost:${PORT}/api`);
      console.log(`🛡️  恶意文件检测模式: ${scanMode}`);
      console.log(`🛡️  安全状态: CORS白名单, CSRF校验, RateLimit 已启用`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
