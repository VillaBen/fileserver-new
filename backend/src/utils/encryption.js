/**
 * 加密工具
 * 使用 AES-256-CBC 加密敏感数据和文件
 * 统一所有加密操作，避免多模块冲突
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let _cachedEncryptionKey = null;
function getEncryptionKey() {
  if (_cachedEncryptionKey) return _cachedEncryptionKey;
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    _cachedEncryptionKey = crypto.randomBytes(32).toString('hex');
  } else {
    _cachedEncryptionKey = envKey;
  }
  return _cachedEncryptionKey.slice(0, 32);
}

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

/**
 * 加密文本数据
 * @param {string} text - 需要加密的文本
 * @returns {string} - 加密后的字符串 (IV:加密数据)
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 解密文本数据
 * @param {string} encryptedText - 加密后的字符串
 * @returns {string} - 解密后的文本
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) {
    return encryptedText;
  }

  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

/**
 * 哈希密码 (bcrypt)
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * 验证密码
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * HMAC 哈希 (用于验证码验证)
 * @param {string} data
 * @param {string} secret
 * @returns {string}
 */
function hmacHash(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * 生成随机字符串
 * @param {number} length
 * @returns {string}
 */
function randomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成 UUID v4
 * @returns {string}
 */
function uuid() {
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

/**
 * 加密文件
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径 (可选，默认添加.enc后缀)
 * @returns {Promise<string>} - 加密后的文件路径
 */
function encryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const output = outputPath || inputPath + '.enc';

    const inputStream = fs.createReadStream(inputPath);
    const outputStream = fs.createWriteStream(output);

    outputStream.write(iv);

    inputStream.on('error', reject);
    outputStream.on('error', reject);
    outputStream.on('finish', () => resolve(output));

    inputStream.pipe(cipher).pipe(outputStream);
  });
}

/**
 * 解密文件
 * @param {string} inputPath - 加密文件路径
 * @param {string} outputPath - 输出文件路径 (可选)
 * @returns {Promise<string>} - 解密后的文件路径
 */
function decryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputPath, (err, data) => {
      if (err) return reject(err);

      const iv = data.slice(0, IV_LENGTH);
      const encrypted = data.slice(IV_LENGTH);
      const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      try {
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        if (outputPath) {
          fs.writeFile(outputPath, decrypted, (err) => {
            if (err) reject(err);
            else resolve(outputPath);
          });
        } else {
          resolve(decrypted);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * 解密文件并返回可读流（流式解密，支持大文件）
 * @param {string} inputPath - 加密文件路径
 * @returns {Promise<ReadableStream>} - 解密后的可读流
 */
function decryptFileToStream(inputPath) {
  return new Promise((resolve, reject) => {
    // 读取文件开头的 IV（16字节）
    const fd = fs.openSync(inputPath, 'r');
    const iv = Buffer.alloc(IV_LENGTH);
    const bytesRead = fs.readSync(fd, iv, 0, IV_LENGTH, 0);
    if (bytesRead < IV_LENGTH) {
      fs.closeSync(fd);
      return reject(new Error('文件损坏：IV 长度不足'));
    }
    fs.closeSync(fd);

    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // 创建从 IV 之后开始读取的流
    const readStream = fs.createReadStream(inputPath, { start: IV_LENGTH });

    // 使用 PassThrough 作为返回的可读流
    const { PassThrough } = require('stream');
    const outputStream = new PassThrough();

    readStream.on('error', reject);
    decipher.on('error', reject);

    readStream.pipe(decipher).pipe(outputStream);
    resolve(outputStream);
  });
}

/**
 * 生成文件哈希 (SHA-256)
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} - 文件的SHA-256哈希
 */
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * 解密文件到缓存目录（异步），返回缓存文件路径
 * 用于支持 HTTP Range 播放：首次请求时解密到缓存，后续 Range 请求直接从缓存读取
 * @param {string} inputPath - 加密文件路径
 * @param {string} cachePath - 缓存目录
 * @param {string} cacheKey - 缓存 key（通常是文件 id）
 * @returns {Promise<string>} - 解密后的缓存文件路径
 */
function decryptFileToCache(inputPath, cachePath, cacheKey) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
    }

    // 读取 IV
    const fd = fs.openSync(inputPath, 'r');
    const iv = Buffer.alloc(IV_LENGTH);
    const bytesRead = fs.readSync(fd, iv, 0, IV_LENGTH, 0);
    fs.closeSync(fd);
    if (bytesRead < IV_LENGTH) {
      return reject(new Error('文件损坏：IV 长度不足'));
    }

    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const outputPath = path.join(cachePath, cacheKey);
    const tmpPath = outputPath + '.tmp';

    const readStream = fs.createReadStream(inputPath, { start: IV_LENGTH });
    const writeStream = fs.createWriteStream(tmpPath);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', () => {
      fs.rename(tmpPath, outputPath, (err) => {
        if (err) reject(err);
        else resolve(outputPath);
      });
    });

    readStream.pipe(decipher).pipe(writeStream);
  });
}

/**
 * 获取缓存文件路径（如已存在且完整则返回路径，否则返回 null）
 * @param {string} cachePath - 缓存目录
 * @param {string} cacheKey - 缓存 key
 * @param {number} expectedSize - 期望的文件大小（不校验传 -1）
 * @returns {string|null}
 */
function getCachedFilePath(cachePath, cacheKey, expectedSize = -1) {
  const filePath = path.join(cachePath, cacheKey);
  if (!fs.existsSync(filePath)) return null;
  if (expectedSize > 0) {
    const stat = fs.statSync(filePath);
    if (stat.size !== expectedSize) return null;
  }
  return filePath;
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  hmacHash,
  randomString,
  uuid,
  encryptFile,
  decryptFile,
  decryptFileToStream,
  decryptFileToCache,
  getCachedFilePath,
  getFileHash
};
