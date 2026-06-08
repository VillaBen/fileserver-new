
// 输入过滤规则
export const FILTER_RULES = {
  USERNAME: {
    pattern: /[^a-zA-Z0-9_-]/g,
    maxLength: 50
  },
  DISPLAY_NAME: {
    pattern: /[^\p{L}\p{N}\s_-]/gu, // 允许字母、数字、空格、下划线、连字符
    maxLength: 100
  },
  EMAIL: {
    pattern: /[^\w@.+-]/g, // 邮箱的合法字符
    maxLength: 100
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

/**
 * 统一的输入过滤函数，防止部分内容残留
 * @param {string} value - 原始输入值
 * @param {Object} rule - 过滤规则
 * @param {Function} onFilter - 过滤时的回调函数
 * @returns {string} - 过滤后的值
 */
export function filterInput(value, rule, onFilter) {
  if (!value) return '';
  
  let sanitized = value;
  
  // 字符过滤
  if (rule.pattern) {
    const original = sanitized;
    sanitized = sanitized.replace(rule.pattern, '');
    
    // 如果有字符被过滤，通知回调
    if (sanitized !== original && onFilter) {
      onFilter();
    }
  }
  
  // 长度限制
  if (rule.maxLength && sanitized.length > rule.maxLength) {
    sanitized = sanitized.slice(0, rule.maxLength);
    
    // 长度截断，通知回调
    if (onFilter) {
      onFilter();
    }
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
