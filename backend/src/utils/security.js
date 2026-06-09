/**
 * 安全工具函数
 */

const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * 防止路径穿越，返回安全的完整路径
 * @param {string} rootDir
 * @param {string} userPath
 * @returns {string}
 */
function safePath(rootDir, userPath) {
  const normalizedRoot = path.resolve(rootDir);
  const resolved = path.resolve(path.normalize(path.join(normalizedRoot, userPath)));
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new Error('Invalid path: path traversal detected');
  }
  return resolved;
}

/**
 * 转义 SQL LIKE 搜索输入中的特殊字符 % _ \
 * @param {string} pattern
 * @returns {string}
 */
function sanitizeLikePattern(pattern) {
  if (typeof pattern !== 'string') return '';
  return pattern.replace(/[\\%_]/g, (char) => '\\' + char);
}

/**
 * 生成 hex 格式随机字符串
 * @param {number} length
 * @returns {string}
 */
function cryptoRandomString(length) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 哈希验证码
 * @param {string} code
 * @returns {Promise<string>}
 */
async function hashCaptchaCode(code) {
  return bcrypt.hash(code, 10);
}

/**
 * 验证验证码
 * @param {string} code
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyCaptchaCode(code, hash) {
  try {
    return bcrypt.compare(code, hash);
  } catch (error) {
    return false;
  }
}

module.exports = {
  safePath,
  sanitizeLikePattern,
  cryptoRandomString,
  hashCaptchaCode,
  verifyCaptchaCode
};
