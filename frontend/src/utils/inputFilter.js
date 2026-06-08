
// 输入过滤规则
export const FILTER_RULES = {
  USERNAME: {
    pattern: /[^a-zA-Z0-9_-]/g,
    maxLength: 50,
    strictThreshold: 0.3, // 超过30%的非法字符就触发严格模式
    allowPattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/ // 用户名必须以字母开头
  },
  DISPLAY_NAME: {
    pattern: /[^\p{L}\p{N}\s_-]/gu, // 允许字母、数字、空格、下划线、连字符
    maxLength: 100,
    strictThreshold: 0.5 // 超过50%的非法字符就触发严格模式
  },
  EMAIL: {
    pattern: /[^\w@.+-]/g, // 邮箱的合法字符
    maxLength: 100,
    strictThreshold: 0.3
  },
  FOLDER_NAME: {
    pattern: /[<>:"/\\|?*]/g, // 禁止的文件名字符
    maxLength: 100
  },
  SEARCH: {
    pattern: /[<>"'/\\|?*]/g, // 搜索框的限制字符
    maxLength: 100
  },
  PASSWORD: {
    pattern: null, // 密码不做字符过滤
    maxLength: 100
  }
};

// 检测特殊输入的模式 - 所有输入类型都禁止的
const GLOBAL_SPECIAL_PATTERNS = [
  /content:\/\/.*\/ime_cache/i, // 斗图URL
];

/**
 * 统一的输入过滤函数，防止部分内容残留
 * @param {string} value - 原始输入值
 * @param {Object} rule - 过滤规则
 * @param {Function} onFilter - 过滤时的回调函数
 * @returns {string} - 过滤后的值
 */
export function filterInput(value, rule, onFilter) {
  if (!value) return '';
  
  // 检测全局特殊输入（所有输入框都禁止）
  const hasGlobalSpecial = GLOBAL_SPECIAL_PATTERNS.some(pattern => pattern.test(value));
  if (hasGlobalSpecial) {
    if (onFilter) onFilter();
    return '';
  }
  
  let sanitized = value;
  let hasFiltered = false;
  
  // 字符过滤
  if (rule.pattern) {
    const original = sanitized;
    sanitized = sanitized.replace(rule.pattern, '');
    
    // 计算非法字符比例
    const invalidRatio = (original.length - sanitized.length) / original.length;
    
    // 如果超过阈值，触发严格模式，直接清空
    if (rule.strictThreshold && invalidRatio > rule.strictThreshold) {
      if (onFilter) onFilter();
      return '';
    }
    
    // 检查是否符合 allowPattern（如果有的话）
    if (rule.allowPattern && sanitized && !rule.allowPattern.test(sanitized)) {
      if (onFilter) onFilter();
      return '';
    }
    
    if (sanitized !== original) {
      hasFiltered = true;
    }
  }
  
  // 长度限制
  if (rule.maxLength && sanitized.length > rule.maxLength) {
    sanitized = sanitized.slice(0, rule.maxLength);
    hasFiltered = true;
  }
  
  if (hasFiltered && onFilter) {
    onFilter();
  }
  
  return sanitized;
}

/**
 * 用户名过滤
 */
export function filterUsername(value, onFilter) {
  return filterInput(value, FILTER_RULES.USERNAME, onFilter);
}

/**
 * 显示名称过滤
 */
export function filterDisplayName(value, onFilter) {
  return filterInput(value, FILTER_RULES.DISPLAY_NAME, onFilter);
}

/**
 * 邮箱过滤
 */
export function filterEmail(value, onFilter) {
  return filterInput(value, FILTER_RULES.EMAIL, onFilter);
}

/**
 * 文件夹名称过滤
 */
export function filterFolderName(value, onFilter) {
  return filterInput(value, FILTER_RULES.FOLDER_NAME, onFilter);
}

/**
 * 搜索框过滤
 */
export function filterSearch(value, onFilter) {
  return filterInput(value, FILTER_RULES.SEARCH, onFilter);
}
