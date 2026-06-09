/**
 * Token 黑名单中间件
 */

const { extractTokenId, extractToken } = require('../utils/jwt');

const blacklist = new Set();

function addToBlacklist(tokenId) {
  if (tokenId) {
    blacklist.add(tokenId);
  }
}

function isBlacklisted(tokenId) {
  if (!tokenId) return false;
  return blacklist.has(tokenId);
}

function cleanup() {
}

function blacklistMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const tokenId = extractTokenId(token);
  if (tokenId && isBlacklisted(tokenId)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_BLACKLISTED',
        message: 'Token 已失效，请重新登录'
      }
    });
  }

  next();
}

module.exports = {
  blacklist,
  addToBlacklist,
  isBlacklisted,
  cleanup,
  blacklistMiddleware
};
