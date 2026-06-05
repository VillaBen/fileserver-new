/**
 * JWT 认证中间件
 */

const { verifyToken, extractToken } = require('../utils/jwt');

/**
 * 验证用户是否已登录
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.apiError('请先登录', 'UNAUTHORIZED');
  }
  
  const user = verifyToken(token);
  
  if (!user) {
    return res.apiError('登录已过期，请重新登录', 'TOKEN_EXPIRED');
  }
  
  req.user = user;
  next();
}

/**
 * 验证用户是否为管理员
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.apiError('需要管理员权限', 'FORBIDDEN');
    }
    next();
  });
}

module.exports = {
  requireAuth,
  requireAdmin
};
