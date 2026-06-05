/**
 * JWT 认证工具
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'filecloud-jwt-secret-key-for-development-only';
const JWT_EXPIRES_IN = '24h';

/**
 * 生成 JWT Token
 * @param {Object} user - 用户信息
 * @returns {string} - JWT Token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object|null} - 用户信息或null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中提取 Token
 * @param {Object} req - Express 请求对象
 * @returns {string|null} - Token 或 null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  return req.cookies.token || null;
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  JWT_SECRET
};
