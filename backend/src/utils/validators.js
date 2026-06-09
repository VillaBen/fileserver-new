/**
 * 验证工具函数
 */

// 用户名正则：3-20个字符，字母、数字、下划线、连字符
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// 邮箱正则
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 密码正则：至少8个字符，包含大小写字母和数字
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// 文件名安全字符：白名单 + 黑名单混合模式
// 白名单：允许中文、英文、数字、英文标点符号
// 黑名单：禁止emoji、控制字符、路径特殊字符、中文标点等
// 只允许英文标点：空格 _ - . , ( ) [ ] { } & ' @ ! # $ % ^ + = ; ` ~
const SAFE_FILENAME_REGEX = /^[\u4e00-\u9fffa-zA-Z0-9 _\-\.,()\[\]{}&'@!#$%^+=;`~]+$/;

// 文件夹名安全字符：与文件名一致
const SAFE_FOLDERNAME_REGEX = /^[\u4e00-\u9fffa-zA-Z0-9 _\-\.,()\[\]{}&'@!#$%^+=;`~]+$/;

// 禁止的中文标点符号
const CHINESE_PUNCTUATION_REGEX = /[（）【】《》""''、，。！？；：……—]/;

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
 * 检查是否包含禁用字符（emoji、特殊符号等）
 */
function hasDisallowedCharacters(str) {
  // 检查emoji和各种特殊Unicode符号
  const emojiRegex = /[\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F6FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{FE00}-\u{FE0F}\u{E000}-\u{F8FF}\u{1F004}\u{1F0CF}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}\u{21AA}\u{231A}\u{231B}\u{23E9}-\u{23EC}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267F}\u{2692}-\u{269C}\u{26A0}\u{26A7}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}-\u{26C8}\u{26CE}-\u{26D3}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2767}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}-\u{1F399}\u{1F39B}-\u{1F39E}\u{1F3A0}-\u{1F3C4}\u{1F3C6}-\u{1F3CA}\u{1F3E0}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}-\u{1F570}\u{1F573}-\u{1F57A}\u{1F587}-\u{1F58A}\u{1F58D}-\u{1F590}\u{1F595}-\u{1F596}\u{1F5A4}-\u{1F5A5}\u{1F5A8}\u{1F5B1}-\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CB}-\u{1F6D2}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6EB}-\u{1F6EC}\u{1F6F0}\u{1F6F3}-\u{1F6FA}\u{1F7E0}-\u{1F7EB}\u{1F90C}-\u{1F93A}\u{1F93C}-\u{1F945}\u{1F947}-\u{1F9FF}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA82}\u{1FA90}-\u{1FA95}\u{1FAA0}-\u{1FAA6}\u{1FAB0}-\u{1FABA}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}\u{1FAE0}-\u{1FAE7}\u{1FAF0}-\u{1FAF6}]/u;
  
  // 检查其他特殊Unicode符号和控制字符
  const specialCharRegex = /[\u{0000}-\u{001F}\u{007F}\u{0080}-\u{009F}\u{2000}-\u{200F}\u{2028}-\u{202F}\u{2060}-\u{206F}\u{FEFF}\u{FFF0}-\u{FFFF}]/u;
  
  return emojiRegex.test(str) || specialCharRegex.test(str);
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
  
  // 检查是否包含禁用字符（emoji、特殊符号等）
  if (hasDisallowedCharacters(trimmed)) {
    errors.push('文件名不能包含emoji、表情符号或特殊装饰字符');
  }
  
  // 文件名允许中文标点符号（用户需求），只检查危险字符和基本格式
  // 危险字符检查：< > : " / \ | ? * 以及控制字符
  const DANGEROUS_CHARS_REGEX = /[<>:"\/|?*\x00-\x1F]/;
  if (DANGEROUS_CHARS_REGEX.test(trimmed)) {
    errors.push('文件名不能包含危险字符（< > : " / \\ | ? *）');
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
  
  // 检查是否包含禁用字符（emoji、特殊符号等）
  if (hasDisallowedCharacters(trimmed)) {
    errors.push('文件夹名不能包含emoji、表情符号或特殊装饰字符');
  }
  
  // 检查是否包含中文标点符号
  if (CHINESE_PUNCTUATION_REGEX.test(trimmed)) {
    errors.push('文件夹名只能使用英文标点符号（(),[],{}等），不能使用中文标点（），【】，等）');
  }
  
  if (!SAFE_FOLDERNAME_REGEX.test(trimmed)) {
    errors.push('文件夹名只能包含中文、英文、数字和英文标点符号（空格_-.(),[]{}&@!#$%^+=;`~）');
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
  hasDisallowedCharacters,
  CHINESE_PUNCTUATION_REGEX,
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX
};
