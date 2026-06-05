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
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  async function init() {
    // 先清除旧的localStorage数据，确保使用新的API路径
    console.log('[Avatar-init] 1. 清除旧的localStorage数据');
    localStorage.removeItem(STORAGE_KEY);
    
    loadFromStorage();
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
        return response;
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
        return response;
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
        return response;
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
        return response;
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
        return response;
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
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.value = null;
      saveToStorage();
    }
  }

  async function fetchUser() {
    try {
      console.log('[Avatar-fetchUser] 1. 开始获取用户信息...');
      
      // 先清除localStorage中的旧数据，确保获取最新数据
      localStorage.removeItem(STORAGE_KEY);
      
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
      user.value = null;
      saveToStorage();
    }
    return null;
  }

  async function changePassword(currentPassword, newPassword) {
    isLoading.value = true;
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      if (response.success) {
        return response;
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
