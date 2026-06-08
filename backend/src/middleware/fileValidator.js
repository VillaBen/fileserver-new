const { 
  allowedExtensions, 
  allowedMimeTypes, 
  fileSignatures, 
  blockedExtensions, 
  maxFileSize,
  maxAvatarSize
} = require('../config/file-types');

// 获取文件扩展名
function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return filename.substring(lastDotIndex + 1).toLowerCase();
}

// 验证文件扩展名
function isValidExtension(filename) {
  const ext = getFileExtension(filename);
  if (!ext) {
    return false;
  }
  
  if (blockedExtensions.includes(ext)) {
    return false;
  }
  
  return allowedExtensions.includes(ext);
}

// 验证 MIME 类型
function isValidMimeType(mimeType) {
  if (!mimeType || typeof mimeType !== 'string') {
    return false;
  }
  
  return allowedMimeTypes.some(pattern => pattern.test(mimeType));
}

// 验证文件头签名
function verifyFileSignature(fileBuffer, filename) {
  if (!fileBuffer || !filename) {
    return { valid: true, message: '无需验证' };
  }
  
  const ext = getFileExtension(filename);
  const signatures = fileSignatures[ext];
  
  if (!signatures || signatures.length === 0) {
    return { valid: true, message: '该类型无需签名验证' };
  }
  
  const signature = fileBuffer.slice(0, signatures[0].length / 2).toString('hex');
  const isValid = signatures.some(s => s.toLowerCase() === signature.toLowerCase());
  
  if (!isValid) {
    return { 
      valid: false, 
      message: `文件内容与扩展名不匹配（检测到: ${signature}，期望: ${signatures.join(', ')}）` 
    };
  }
  
  return { valid: true, message: '签名验证通过' };
}

// 验证文件大小
function isValidFileSize(size) {
  return size <= maxFileSize;
}

// 验证头像文件大小
function isValidAvatarSize(size) {
  return size <= maxAvatarSize;
}

// 验证是否为安全的图片类型（用于头像）
function isSafeImageType(filename, mimeType) {
  if (!filename || !mimeType) return false;
  
  // 只允许安全的图片扩展名
  const safeExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
  const ext = getFileExtension(filename);
  
  if (!safeExtensions.includes(ext)) {
    return false;
  }
  
  // MIME类型必须以image/开头
  if (!mimeType.startsWith('image/')) {
    return false;
  }
  
  // 特别禁止 SVG（可能包含恶意脚本）
  if (ext === 'svg' || mimeType === 'image/svg+xml') {
    return false;
  }
  
  return true;
}

// 头像验证中间件
function validateAvatar(req, res, next) {
  const file = req.file;
  
  if (!file) {
    return res.apiError('请上传文件', 'NO_FILE_PROVIDED');
  }
  
  // 检查文件大小
  if (!isValidAvatarSize(file.size)) {
    return res.apiError(`头像大小超过限制（最大 ${maxAvatarSize / (1024 * 1024)}MB）`, 'FILE_TOO_LARGE');
  }
  
  // 检查是否为安全的图片类型
  if (!isSafeImageType(file.originalname, file.mimetype)) {
    const ext = getFileExtension(file.originalname);
    return res.apiError(`不支持的图片类型: ${ext || '无扩展名'}（仅支持 PNG, JPG, GIF, WebP, BMP）`, 'INVALID_AVATAR_TYPE');
  }
  
  // 检查文件头签名
  if (file.buffer) {
    const signatureResult = verifyFileSignature(file.buffer, file.originalname);
    if (!signatureResult.valid) {
      return res.apiError(signatureResult.message, 'FILE_CONTENT_MISMATCH');
    }
  }
  
  next();
}

// 文件验证中间件
function validateFile(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);
  
  for (const file of files) {
    // 检查文件大小
    if (!isValidFileSize(file.size)) {
      return res.apiError(`文件大小超过限制（最大 ${maxFileSize / (1024 * 1024)}MB）`, 'FILE_TOO_LARGE');
    }
    
    // 检查扩展名
    if (!isValidExtension(file.originalname)) {
      const ext = getFileExtension(file.originalname);
      if (blockedExtensions.includes(ext)) {
        return res.apiError(`禁止上传该类型文件: ${ext}`, 'FILE_TYPE_BLOCKED');
      }
      return res.apiError(`不支持的文件类型: ${ext || '无扩展名'}`, 'INVALID_FILE_TYPE');
    }
    
    // 检查 MIME 类型
    if (!isValidMimeType(file.mimetype)) {
      return res.apiError(`不支持的 MIME 类型: ${file.mimetype}`, 'INVALID_MIME_TYPE');
    }
    
    // 检查文件头签名（仅对特定类型）
    if (file.buffer) {
      const signatureResult = verifyFileSignature(file.buffer, file.originalname);
      if (!signatureResult.valid) {
        return res.apiError(signatureResult.message, 'FILE_CONTENT_MISMATCH');
      }
    }
  }
  
  next();
}

module.exports = {
  getFileExtension,
  isValidExtension,
  isValidMimeType,
  verifyFileSignature,
  isValidFileSize,
  isValidAvatarSize,
  isSafeImageType,
  validateFile,
  validateAvatar,
  maxFileSize,
  maxAvatarSize
};