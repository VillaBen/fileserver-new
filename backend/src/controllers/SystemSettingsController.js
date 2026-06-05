/**
 * 系统设置控制器
 */

const { db } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const { testConnection, sendEmail } = require('../utils/email');

// 获取所有设置
async function getSettings(req, res) {
  try {
    const settings = await db.asyncAll('SELECT * FROM system_settings');
    
    // 解密敏感设置
    const decryptedSettings = {};
    for (const setting of settings) {
      if (setting.key.includes('_api_key') || setting.key.includes('secret') || setting.key.includes('password') || setting.key === 'smtp_pass' || setting.key === 'smtp_user') {
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
      if (key.includes('_api_key') || key.includes('secret') || key.includes('password') || key === 'smtp_pass' || key === 'smtp_user') {
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

// 测试 SMTP 连接
async function testSmtp(req, res) {
  try {
    const config = req.body;
    
    if (!config.host || !config.user || !config.pass) {
      return res.apiError('请填写完整的 SMTP 配置', 'VALIDATION_ERROR');
    }
    
    const result = await testConnection(config);
    
    if (result.success) {
      res.apiSuccess(null, result.message);
    } else {
      res.apiError(result.message, 'SMTP_TEST_ERROR');
    }
  } catch (error) {
    console.error('测试 SMTP 连接失败:', error);
    res.apiError('测试失败: ' + error.message, 'SMTP_TEST_ERROR');
  }
}

// 发送测试邮件
async function sendTestEmail(req, res) {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.apiError('请填写收件人邮箱', 'VALIDATION_ERROR');
    }
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">🎉 FileCloud 邮件配置成功!</h2>
        <p>这是一封测试邮件，说明您的 SMTP 配置已经正确。</p>
        <p style="color: #909399; font-size: 12px;">发送时间: ${new Date().toLocaleString()}</p>
      </div>
    `;
    
    await sendEmail({
      to,
      subject: 'FileCloud 测试邮件',
      html
    });
    
    res.apiSuccess(null, '测试邮件已发送');
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.apiError('发送失败: ' + error.message, 'SEND_TEST_EMAIL_ERROR');
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testSmtp,
  sendTestEmail
};
