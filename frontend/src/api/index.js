import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore();
    const token = authStore.user?.token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // 对于 blob 类型的响应，保留完整响应对象
    if (response.config.responseType === 'blob') {
      return response;
    }
    // 其他情况直接返回 response.data，简化调用方式
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      window.location.href = '/login';
    }
    // 改造错误对象，让它包含后端返回的详细信息
    if (error.response?.data) {
      const resData = error.response.data;
      let errorMessage = '请求失败';
      let errorCode = 'ERROR';

      if (resData.error && typeof resData.error === 'object') {
        // 后端新格式: { success: false, error: { code, message } }
        errorMessage = resData.error.message || errorMessage;
        errorCode = resData.error.code || errorCode;
      } else if (resData.error) {
        // 兼容可能的旧格式
        errorMessage = resData.error;
        errorCode = resData.errorCode || resData.code || errorCode;
      } else if (resData.message) {
        errorMessage = resData.message;
      }

      const enhancedError = {
        ...error,
        error: errorMessage,
        errorCode: errorCode,
        success: false,
        data: null,
      };
      return Promise.reject(enhancedError);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  loginToken: (data) => apiClient.post('/auth/login-token', data),
  login2FA: (data) => apiClient.post('/auth/login-2fa', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  setup2FA: () => apiClient.post('/auth/2fa/setup'),
  verify2FA: (data) => apiClient.post('/auth/2fa/verify', data),
  disable2FA: () => apiClient.post('/auth/2fa/disable'),
  generateRecoveryCodes: () => apiClient.post('/auth/2fa/recovery-codes'),
  useRecoveryCode: (data) => apiClient.post('/auth/2fa/use-recovery', data),
};

export const captchaAPI = {
  generate: () => apiClient.get('/captcha/generate'),
  verify: (data) => apiClient.post('/captcha/verify', data),
};

export const userAPI = {
  checkUsername: (username) => apiClient.post('/user/check-username', { username }),
  checkEmail: (email) => apiClient.post('/user/check-email', { email }),
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (data) => apiClient.put('/user/profile', data),
  getStorage: () => apiClient.get('/user/storage'),
  uploadAvatar: (formData) => apiClient.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAvatar: () => apiClient.delete('/user/avatar'),
};

export const filesAPI = {
  getFiles: (params) => apiClient.get('/files', { params }),
  getFile: (id) => apiClient.get(`/files/${id}`),
  previewScan: (formData) => apiClient.post('/files/preview-scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  upload: (formData, options = {}) => {
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...options,
    };
    return apiClient.post('/files/upload', formData, config);
  },
  uploadWithProgress: (formData, onProgress, options = {}) => {
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total > 0) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      ...options,
    };
    return apiClient.post('/files/upload', formData, config);
  },
  download: (id) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' }),
  preview: (id) => apiClient.get(`/files/${id}/preview`, { responseType: 'blob' }),
  delete: (id) => apiClient.delete(`/files/${id}`),
  restore: (id, data) => apiClient.post(`/files/${id}/restore`, data),
  deletePermanently: (id) => apiClient.delete(`/files/${id}/permanently`),
  emptyTrash: () => apiClient.post('/files/empty-trash'),
  move: (data) => apiClient.post('/files/move', data),
  rename: (id, data) => apiClient.put(`/files/${id}/rename`, data),
  search: (data) => apiClient.post('/files/search', data),
  getFolders: (params) => apiClient.get('/files/folders', { params }),
  createFolder: (data) => apiClient.post('/files/folders', data),
  getStats: () => apiClient.get('/files/stats'),
  checkConflict: (data) => apiClient.post('/files/check-conflict', data),
};

export const sharesAPI = {
  getShares: () => apiClient.get('/shares'),
  getMyShares: () => apiClient.get('/shares'),
  createShare: (fileId, data) => apiClient.post(`/shares/files/${fileId}`, data),
  updateShare: (id, data) => apiClient.put(`/shares/${id}`, data),
  deleteShare: (id) => apiClient.delete(`/shares/${id}`),
  getShareInfo: (code) => apiClient.get(`/shares/public/${code}`),
  downloadShare: (code, data) => apiClient.post(`/shares/public/${code}/download`, data, {
    responseType: 'blob',
  }),
};

export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserDetails: (accountId) => apiClient.get(`/admin/users/${accountId}`),
  updateUserRole: (accountId, data) => apiClient.put(`/admin/users/${accountId}/role`, data),
  updateUserStatus: (accountId, data) => apiClient.put(`/admin/users/${accountId}/status`, data),
  updateUserQuota: (accountId, data) => apiClient.put(`/admin/users/${accountId}/quota`, data),
  deleteUser: (accountId) => apiClient.delete(`/admin/users/${accountId}`),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
  getAllFiles: (params) => apiClient.get('/admin/files', { params }),
};

export const commonAPI = {
  getCsrfToken: () => apiClient.get('/csrf-token'),
  health: () => apiClient.get('/health'),
};
