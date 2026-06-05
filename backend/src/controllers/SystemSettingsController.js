/**
 * 系统设置控制器
 */

const { db } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

// 获取所有设置
async function getSettings(req, res) {
  try {
    const settings = await db.asyncAll('SELECT * FROM system_settings');
    
    // 解密敏感设置
    const decryptedSettings = {};
    for (const setting of settings) {
      if (setting.key.includes('_api_key') || setting.key.includes('secret') || setting.key.includes('password')) {
        decryptedSettings[setting.key] = decrypt(setting.value || '');
      } else {
        decryptedSettings[setting.key] = setting.value;
      }
    }
    
    res.apiSuccess(decryptedSettings);
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.apiError('获取系统设置失败', 'GET_SETTINGS_ERROR');
  }
}

// 更新设置
async function updateSettings(req, res) {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      // 检查设置是否存在
      const existing = await db.asyncGet(
        'SELECT id FROM system_settings WHERE `key` = ?',
        [key]
      );
      
      // 加密敏感设置
      let finalValue = value;
      if (key.includes('_api_key') || key.includes('secret') || key.includes('password')) {
        finalValue = encrypt(value);
      }
      
      if (existing) {
        // 更新现有设置
        await db.asyncRun(
          'UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE `key` = ?',
          [finalValue, key]
        );
      } else {
        // 插入新设置
        await db.asyncRun(
          'INSERT INTO system_settings (`key`, value) VALUES (?, ?)',
          [key, finalValue]
        );
      }
    }
    
    res.apiSuccess(null, '设置更新成功');
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.apiError('更新系统设置失败', 'UPDATE_SETTINGS_ERROR');
  }
}

module.exports = {
  getSettings,
  updateSettings
};
