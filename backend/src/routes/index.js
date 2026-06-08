// src/routes/index.js
const authRoutes = require('./auth');
const userRoutes = require('./user');
const fileRoutes = require('./files');
const shareRoutes = require('./shares');
const adminRoutes = require('./admin');
const captchaRoutes = require('./captcha');
const apiTokenRoutes = require('./apiTokens');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function setupRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);  // 用户路由不需要全局认证，check-username和check-email在路由内部处理认证
  app.use('/api/files', requireAuth, fileRoutes);
  app.use('/api/shares', requireAuth, shareRoutes);
  app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);
  app.use('/api/captcha', captchaRoutes);
  app.use('/api/tokens', requireAuth, apiTokenRoutes);
}

module.exports = {
  setupRoutes
};
