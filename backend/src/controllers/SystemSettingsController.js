/**
 * 系统设置控制器
 */

const { db } = require('../config/database.adapter');
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

// 测试 VirusTotal API
async function testVirusTotal(req, res) {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.apiError('请填写 VirusTotal API Key', 'VALIDATION_ERROR');
    }

    // 使用一个安全文件的哈希进行测试 (EICAR test file SHA-256)
    // 注意：我们使用一个已知安全的文件哈希来测试
    const testHash = '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f';
    
    const https = require('https');
    const { URL } = require('url');
    
    const url = new URL(`/api/v3/files/${testHash}`, 'https://www.virustotal.com');
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'x-apikey': apiKey
      },
      timeout: 10000
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: JSON.parse(responseBody) });
          } else if (res.statusCode === 404) {
            // 404是正常的，说明测试文件不在数据库中，但API Key有效
            resolve({ statusCode: res.statusCode, data: null });
          } else {
            reject(new Error(`API Error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request Timeout'));
      });

      req.end();
    });

    res.apiSuccess(null, 'VirusTotal API Key 验证成功');
  } catch (error) {
    console.error('测试 VirusTotal API 失败:', error);
    res.apiError('验证失败: ' + error.message, 'VIRUSTOTAL_TEST_ERROR');
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
  sendTestEmail,
  testVirusTotal
};
