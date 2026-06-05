// src/api/client.js
import api from './index';

export default {
  // 获取系统设置
  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  // 更新系统设置
  async updateSettings(settings) {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  // 更新 VirusTotal API Key
  async updateVirusTotalApiKey(apiKey) {
    return this.updateSettings({ virustotal_api_key: apiKey });
  },

  // 获取 VirusTotal API Key
  async getVirusTotalApiKey() {
    const response = await this.getSettings();
    return response.data?.virustotal_api_key || '';
  }
};
