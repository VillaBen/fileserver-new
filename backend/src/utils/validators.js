/**
 * 验证工具函数
 */

// 用户名正则：3-20个字符，字母、数字、下划线、连字符
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// 邮箱正则
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 密码正则：至少8个字符，包含大小写字母和数字
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// 文件名安全字符：不包含特殊路径字符
const SAFE_FILENAME_REGEX = /^[^<>:"/\\|?*]+$/;

// 文件夹名安全字符
const SAFE_FOLDERNAME_REGEX = /^[^<>:"/\\|?*]+$/;

/**
 * 验证用户名
 */
function validateUsername(username) {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('用户名不能为空');
    return { valid: false, errors };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    errors.push('用户名至少需要3个字符');
  }
  
  if (trimmed.length > 20) {
    errors.push('用户名不能超过20个字符');
  }
  
  if (!USERNAME_REGEX.test(trimmed)) {
    errors.push('用户名只能包含字母、数字、下划线和连字符');
  }
  
  // 检查是否包含敏感词
  const sensitiveWords = ['admin', 'root', 'system', 'filecloud', 'moderator', 'support'];
  const lowerUsername = trimmed.toLowerCase();
  for (const word of sensitiveWords) {
    if (lowerUsername === word || lowerUsername.includes(word)) {
      errors.push('用户名包含禁用词汇');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    clean: trimmed
  };
}

/**
 * 验证邮箱
 */
function validateEmail(email, required = false) {
  const errors = [];
  
  if (!email || typeof email !== 'string') {
    if (required) {
      errors.push('邮箱不能为空');
    }
    return { valid: !required, errors, clean: '' };
  }
  
  const trimmed = email.trim();
  
  if (!trimmed) {
    if (required) {
      errors.push('邮箱不能为空');
    }
    return { valid: !required, errors, clean: '' };
  }
  
  if (trimmed.length > 254) {
    errors.push('邮箱不能超过254个字符');
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    errors.push('请输入有效的邮箱地址');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    clean: trimmed.toLowerCase()
  };
}

/**
 * 验证密码
 */
function validatePassword(password, confirmPassword = null) {
  const errors = [];
  const strength = {
    score: 0,
    label: 'weak',
    suggestions: []
  };
  
  if (!password || typeof password !== 'string') {
    errors.push('密码不能为空');
    return { valid: false, errors, strength };
  }
  
  if (password.length < 8) {
    errors.push('密码至少需要8个字符');
    strength.suggestions.push('密码至少需要8个字符');
  }
  
  if (password.length > 128) {
    errors.push('密码不能超过128个字符');
  }
  
  if (!/[a-z]/.test(password)) {
    strength.suggestions.push('包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    strength.suggestions.push('包含大写字母');
  }
  
  if (!/\d/.test(password)) {
    strength.suggestions.push('包含数字');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\/`~]/.test(password)) {
    strength.suggestions.push('包含特殊字符');
  }
  
  // 计算密码强度分数
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-=+\[\]\\/`~]/.test(password)) score++;
  
  if (score <= 2) {
    strength.label = 'weak';
  } else if (score <= 4) {
    strength.label = 'medium';
  } else {
    strength.label = 'strong';
  }
  strength.score = score;
  
  // 确认密码验证
  if (confirmPassword !== null && confirmPassword !== password) {
    errors.push('两次输入的密码不一致');
  }
  
  // 检查常见密码
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password1', '111111', '123123', 'admin', 'letmein'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('密码太常见，请使用更安全的密码');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * 验证文件名
 */
function validateFilename(filename, requireExtension = true) {
  const errors = [];
  
  if (!filename || typeof filename !== 'string') {
    errors.push('文件名不能为空');
    return { valid: false, errors, clean: '' };
  }
  
  const trimmed = filename.trim();
  
  if (trimmed.length === 0) {
    errors.push('文件名不能为空');
    return { valid: false, errors, clean: '' };
  }
  
  if (trimmed.length > 255) {
    errors.push('文件名不能超过255个字符');
  }
  
  if (!SAFE_FILENAME_REGEX.test(trimmed)) {
    errors.push('文件名包含非法字符（<>:\"/\\|?*）');
  }
  
  // 检查是否以.开头（隐藏文件）
  if (trimmed.startsWith('.')) {
    errors.push('文件名不能以点开头');
  }
  
  // 检查是否只有点
  if (/^\.+$/.test(trimmed)) {
    errors.push('无效的文件名');
  }
  
  // 检查扩展名
  if (requireExtension && !trimmed.includes('.')) {
    errors.push('文件需要包含扩展名');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    clean: trimmed
  };
}

/**
 * 验证文件夹名
 */
function validateFoldername(foldername) {
  const errors = [];
  
  if (!foldername || typeof foldername !== 'string') {
    errors.push('文件夹名不能为空');
    return { valid: false, errors, clean: '' };
  }
  
  const trimmed = foldername.trim();
  
  if (trimmed.length === 0) {
    errors.push('文件夹名不能为空');
    return { valid: false, errors, clean: '' };
  }
  
  if (trimmed.length > 100) {
    errors.push('文件夹名不能超过100个字符');
  }
  
  if (!SAFE_FOLDERNAME_REGEX.test(trimmed)) {
    errors.push('文件夹名包含非法字符（<>:\"/\\|?*）');
  }
  
  if (trimmed.startsWith('.')) {
    errors.push('文件夹名不能以点开头');
  }
  
  if (/^\.+$/.test(trimmed)) {
    errors.push('无效的文件夹名');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    clean: trimmed
  };
}

/**
 * 验证显示名称
 */
function validateDisplayName(displayName) {
  const errors = [];
  
  if (!displayName || typeof displayName !== 'string') {
    return { valid: true, errors, clean: '' };
  }
  
  const trimmed = displayName.trim();
  
  if (trimmed.length > 50) {
    errors.push('显示名称不能超过50个字符');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    clean: trimmed
  };
}

module.exports = {
  validateUsername,
  validateEmail,
  validatePassword,
  validateFilename,
  validateFoldername,
  validateDisplayName,
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX
};
