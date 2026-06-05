import apiClient from './client';

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
  upload: (formData) => apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' }),
  preview: (id) => apiClient.get(`/files/${id}/preview`, { responseType: 'blob' }),
  delete: (id) => apiClient.delete(`/files/${id}`),
  restore: (id, data) => apiClient.post(`/files/${id}/restore`, data),
  deletePermanently: (id) => apiClient.delete(`/files/${id}/permanently`),
  emptyTrash: () => apiClient.post('/files/empty-trash'),
  move: (data) => apiClient.post('/files/move', data),
  rename: (id, data) => apiClient.put(`/files/${id}/rename`, data),
  search: (params) => apiClient.get('/files/search', { params }),
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
