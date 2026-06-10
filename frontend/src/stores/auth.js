import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI, commonAPI } from '../api';
import { toast } from '../utils/toast';

const STORAGE_KEY = 'filecloud_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const csrfToken = ref('');
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        user.value = JSON.parse(stored);
        // 确保 token 也被加载
        if (user.value.token) {
          localStorage.setItem('token', user.value.token);
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveToStorage() {
    try {
      if (user.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value));
        // 单独保存 token，供 axios 请求拦截器使用
        if (user.value.token) {
          localStorage.setItem('token', user.value.token);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  async function init() {
    // 先从 localStorage 加载用户信息
    loadFromStorage();
    
    // 获取 CSRF token
    try {
      const tokenResponse = await commonAPI.getCsrfToken();
      if (tokenResponse.success) {
        csrfToken.value = tokenResponse.data.csrfToken;
        localStorage.setItem('csrfToken', csrfToken.value);
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
  }

  async function initIfNeeded() {
    if (!csrfToken.value) {
      await init();
    }
  }

  async function login(username, password, captcha = null) {
    await initIfNeeded();
    isLoading.value = true;

    try {
      const requestData = { username, password };
      if (captcha?.captchaId && captcha?.captchaCode) {
        requestData.captchaId = captcha.captchaId;
        requestData.captchaCode = captcha.captchaCode;
      }

      const response = await authAPI.login(requestData);
      if (response.success) {
        if (response.data?.requiresTwoFactor) {
          return response.data;
        }
        user.value = response.data;
        saveToStorage();
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function loginWithTwoFactor(tempSessionId, code) {
    isLoading.value = true;
    try {
      const response = await authAPI.login2FA({ tempSessionId, code });
      if (response.success) {
        user.value = response.data;
        saveToStorage();
        toast.success('登录成功！');
        return response.data;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || '验证失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(username, password, email, captcha = null) {
    await initIfNeeded();
    isLoading.value = true;

    try {
      const requestData = { username, password };
      if (email) requestData.email = email;
      if (captcha?.captchaId && captcha?.captchaCode) {
        requestData.captchaId = captcha.captchaId;
        requestData.captchaCode = captcha.captchaCode;
      }

      const response = await authAPI.register(requestData);
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function setupTwoFactor() {
    try {
      const response = await authAPI.setup2FA();
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || '设置失败');
      throw error;
    }
  }

  async function verifyTwoFactor(code) {
    isLoading.value = true;
    try {
      const response = await authAPI.verify2FA({ code });
      if (response.success) {
        await fetchUser();
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function disableTwoFactor() {
    try {
      const response = await authAPI.disable2FA();
      if (response.success) {
        await fetchUser();
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    }
  }

  async function generateRecoveryCodes() {
    try {
      const response = await authAPI.generateRecoveryCodes();
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    // 先清除本地状态，确保立即生效
    user.value = null;
    saveToStorage();
    
    // 然后尝试通知服务器
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async function fetchUser() {
    try {
      console.log('[Avatar-fetchUser] 1. 开始获取用户信息...');
      
      const response = await authAPI.getMe();
      console.log('[Avatar-fetchUser] 2. API响应:', response);
      console.log('[Avatar-fetchUser] 3. API响应数据:', response?.data);
      console.log('[Avatar-fetchUser] 4. API响应中的avatarUrl:', response?.data?.avatarUrl);
      
      if (response.success) {
        user.value = response.data;
        saveToStorage();
        console.log('[Avatar-fetchUser] 5. 设置后的user.value:', user.value);
        console.log('[Avatar-fetchUser] 6. user.value.avatarUrl:', user.value?.avatarUrl);
        return response.data;
      }
    } catch (error) {
      console.error('[Avatar-fetchUser] 获取用户信息失败:', error);
      // API 失败时不清除用户状态，保留 localStorage 中的数据
      // 这样可以确保服务器重启后用户状态不会丢失
    }
    return null;
  }

  async function changePassword(currentPassword, newPassword) {
    isLoading.value = true;
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    csrfToken,
    init,
    login,
    loginWithTwoFactor,
    register,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    generateRecoveryCodes,
    logout,
    fetchUser,
    changePassword,
  };
});
