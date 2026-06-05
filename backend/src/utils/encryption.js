/**
 * 加密工具
 * 使用 AES-256-CBC 加密敏感数据和文件
 * 统一所有加密操作，避免多模块冲突
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// 密钥 (生产环境应放在环境变量中)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-byte-key-for-filecloud'; // 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16 bytes
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
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
 * 解密文件并返回可读流
 * @param {string} inputPath - 加密文件路径
 * @returns {Promise<ReadableStream>} - 解密后的可读流
 */
function decryptFileToStream(inputPath) {
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
        
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(decrypted);
        stream.push(null);
        
        resolve(stream);
      } catch (e) {
        reject(e);
      }
    });
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
  getFileHash
};
