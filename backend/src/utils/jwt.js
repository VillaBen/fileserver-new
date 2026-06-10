/**
 * JWT 认证工具
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let _cachedJwtSecret = null;
function getJwtSecret() {
  if (_cachedJwtSecret) return _cachedJwtSecret;
  const envSecret = process.env.JWT_SECRET;
  if (!envSecret || envSecret === 'filecloud-jwt-secret-key-for-development-only') {
    _cachedJwtSecret = crypto.randomBytes(32).toString('hex');
  } else {
    _cachedJwtSecret = envSecret;
  }
  return _cachedJwtSecret;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = '4h';

/**
 * 生成 JWT Token
 * @param {Object} user - 用户信息
 * @returns {string} - JWT Token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    iat: Date.now()
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

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 支持通过 query 参数传递 token（用于 <audio> / <video> / <img> 等标签）
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
}

/**
 * 从 token 中提取 iat 作为唯一 ID
 * @param {string} token
 * @returns {string|null}
 */
function extractTokenId(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded.iat === 'undefined') return null;
    return decoded.iat.toString();
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  extractTokenId,
  JWT_SECRET
};
