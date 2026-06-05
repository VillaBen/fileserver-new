const { db } = require('../config/database');

// 获取系统设置
const getSettings = async (req, res) => {
  try {
    const settings = await db.asyncAll(
      'SELECT * FROM system_settings'
    );

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.apiSuccess({ settings: settingsObj });
  } catch (error) {
    console.error('获取系统设置错误:', error);
    res.apiError('获取系统设置失败', 'GET_SETTINGS_ERROR');
  }
};

// 更新系统设置
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      // 检查设置是否存在
      const existing = await db.asyncGet(
        'SELECT id FROM system_settings WHERE key = ?',
        [key]
      );

      if (existing) {
        // 更新现有设置
        await db.asyncRun(
          'UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
          [JSON.stringify(value), key]
        );
      } else {
        // 创建新设置
        await db.asyncRun(
          'INSERT INTO system_settings (key, value) VALUES (?, ?)',
          [key, JSON.stringify(value)]
        );
      }
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_system_settings', req.ip, JSON.stringify({ updatedKeys: Object.keys(settings) })]
    );

    res.apiSuccess(null, '系统设置更新成功');
  } catch (error) {
    console.error('更新系统设置错误:', error);
    res.apiError('更新系统设置失败', 'UPDATE_SETTINGS_ERROR');
  }
};

module.exports = {
  getSettings,
  updateSettings
};
