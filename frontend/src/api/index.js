import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore();
    const token = authStore.user?.token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    // FormData 请求由浏览器自动设置正确的 Content-Type 和 boundary
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
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
      if (window.location.pathname !== '/login') {
        const authStore = useAuthStore();
        authStore.logout();
        window.location.href = '/login';
      }
    }

    // 处理 blob 类型的错误响应（预览/下载等请求）
    if (error.response?.config?.responseType === 'blob' && error.response.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const resData = JSON.parse(text);
        if (resData.error) {
          const enhancedError = {
            ...error,
            error: resData.error.message || '请求失败',
            errorCode: resData.error.code || 'ERROR',
            success: false,
            data: null,
          };
          return Promise.reject(enhancedError);
        }
      } catch (e) {
        // 如果不是 JSON，说明是真正的文件响应但状态码不对
        return Promise.reject({
          ...error,
          error: '文件处理失败',
          errorCode: 'FILE_ERROR',
          success: false,
          data: null,
        });
      }
    }

    if (error.response?.data) {
      const resData = error.response.data;
      const errCode = resData.error?.code || resData.errorCode || resData.code;
      if (errCode === 'TOKEN_EXPIRED' || errCode === 'UNAUTHORIZED') {
        if (window.location.pathname !== '/login') {
          const authStore = useAuthStore();
          authStore.logout();
          window.location.href = '/login';
        }
      }
    }

    if (error.response?.data) {
      const resData = error.response.data;
      let errorMessage = '请求失败';
      let errorCode = 'ERROR';

      if (resData.error && typeof resData.error === 'object') {
        errorMessage = resData.error.message || errorMessage;
        errorCode = resData.error.code || errorCode;
      } else if (resData.error) {
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
  getAuthConfig: () => apiClient.get('/auth/config'),
  sendEmailVerificationCode: (data) => apiClient.post('/auth/email-verification-code/send', data),
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
  uploadAvatar: (formData) => apiClient.post('/user/avatar', formData),
  deleteAvatar: () => apiClient.delete('/user/avatar'),
};

export const filesAPI = {
  getFiles: (params) => apiClient.get('/files', { params }),
  getFile: (id) => apiClient.get(`/files/${id}`),
  previewScan: (formData) => apiClient.post('/files/preview-scan', formData),
  getSupportedTypes: () => apiClient.get('/files/supported-types'),
  upload: (formData, options = {}) => {
    return apiClient.post('/files/upload', formData, options);
  },
  uploadWithProgress: (formData, onProgress, options = {}) => {
    const config = {
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
  getScanResult: (id) => apiClient.get(`/files/${id}/scan-result`),
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

// 用户安全相关 API（安全问题、信任设备、登录日志）
export const securityAPI = {
  getSecurityQuestion: () => apiClient.get('/security/security-question'),
  setSecurityQuestion: (data) => apiClient.post('/security/security-question', data),
  updateSecurityQuestion: (data) => apiClient.put('/security/security-question', data),
  deleteSecurityQuestion: (data) => apiClient.delete('/security/security-question', { data }),
  getTrustedDevices: () => apiClient.get('/security/trusted-devices'),
  addTrustedDevice: (data) => apiClient.post('/security/trusted-devices', data),
  deleteTrustedDevice: (id) => apiClient.delete(`/security/trusted-devices/${id}`),
  clearTrustedDevices: () => apiClient.delete('/security/trusted-devices'),
  getLoginLogs: (params) => apiClient.get('/security/login-logs', { params }),
  clearLoginLogs: () => apiClient.delete('/security/login-logs'),
};

// 通知系统 API
export const notificationsAPI = {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAsUnread: (id) => apiClient.put(`/notifications/${id}/unread`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
  clearAll: () => apiClient.delete('/notifications'),
  createNotification: (data) => apiClient.post('/notifications', data),
};

// 播放列表 API
export const playlistsAPI = {
  getPlaylists: () => apiClient.get('/playlists'),
  getPlaylist: (id) => apiClient.get(`/playlists/${id}`),
  createPlaylist: (data) => apiClient.post('/playlists', data),
  updatePlaylist: (id, data) => apiClient.put(`/playlists/${id}`, data),
  deletePlaylist: (id) => apiClient.delete(`/playlists/${id}`),
  addItem: (id, data) => apiClient.post(`/playlists/${id}/items`, data),
  addItemsBatch: (id, data) => apiClient.post(`/playlists/${id}/items/batch`, data),
  removeItem: (id, itemId) => apiClient.delete(`/playlists/${id}/items/${itemId}`),
  reorderItems: (id, data) => apiClient.post(`/playlists/${id}/items/reorder`, data),
};

export const commonAPI = {
  getCsrfToken: () => apiClient.get('/csrf-token'),
  health: () => apiClient.get('/health'),
};
