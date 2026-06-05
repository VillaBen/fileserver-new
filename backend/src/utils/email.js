/**
 * 邮件发送工具类
 */

const nodemailer = require('nodemailer');
const { db } = require('../config/database');
const { decrypt } = require('../utils/encryption');

// 获取邮件配置
async function getEmailConfig() {
  try {
    const settings = await db.asyncAll('SELECT * FROM system_settings WHERE key LIKE ?', ['smtp_%']);
    
    const config = {};
    for (const setting of settings) {
      let value = setting.value;
      
      // 解密密码等敏感信息
      if (setting.key === 'smtp_pass' || setting.key === 'smtp_user') {
        try {
          value = decrypt(value);
        } catch (e) {
          // 如果解密失败，尝试使用原始值
        }
      }
      
      config[setting.key] = value;
    }
    
    // 如果数据库没有配置，检查环境变量
    if (!config.smtp_host) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
      };
    }
    
    return {
      host: config.smtp_host,
      port: parseInt(config.smtp_port) || 587,
      secure: config.smtp_secure === 'true',
      user: config.smtp_user,
      pass: config.smtp_pass,
      from: config.smtp_from
    };
  } catch (error) {
    console.error('获取邮件配置错误:', error);
    // 回退到环境变量
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM
    };
  }
}

// 创建传输器
async function createTransporter() {
  const config = await getEmailConfig();
  
  if (!config.host) {
    throw new Error('邮件服务未配置，请在安全设置中配置 SMTP');
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

// 发送邮件
async function sendEmail(options) {
  try {
    const transporter = await createTransporter();
    const config = await getEmailConfig();
    
    const mailOptions = {
      from: options.from || config.from || 'noreply@example.com',
      to: options.to,
      subject: options.subject,
      html: options.html || options.text,
      text: options.text
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 邮件已发送:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ 发送邮件错误:', error);
    throw error;
  }
}

// 测试 SMTP 连接
async function testConnection(config) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
    
    await transporter.verify();
    return { success: true, message: 'SMTP 连接验证成功' };
  } catch (error) {
    console.error('❌ SMTP 连接验证错误:', error);
    return { success: false, message: error.message };
  }
}

// 发送邮箱验证码
async function sendEmailCode(to, code, purpose) {
  const subjectMap = {
    'register': '注册验证码',
    'reset-password': '重置密码验证码',
    'verify-email': '邮箱验证验证码',
    'login': '登录验证码'
  };
  
  const subject = subjectMap[purpose] || '验证码';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">FileCloud 验证码</h2>
      <p>您的验证码是：</p>
      <div style="font-size: 32px; font-weight: bold; color: #409eff; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: #f5f7fa; border-radius: 8px; text-align: center;">
        ${code}
      </div>
      <p style="color: #909399;">验证码将在 30 分钟后过期，请及时使用。</p>
      <p style="color: #909399; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject,
    html
  });
}

// 发送密码重置链接
async function sendPasswordReset(to, resetUrl) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">重置您的 FileCloud 密码</h2>
      <p>点击下面的链接重置您的密码：</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #409eff; color: white; text-decoration: none; border-radius: 4px; font-size: 16px;">
          重置密码
        </a>
      </div>
      <p style="color: #909399;">链接将在 1 小时后过期，请及时使用。</p>
      <p style="color: #909399; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: 'FileCloud 密码重置',
    html
  });
}

module.exports = {
  sendEmail,
  sendEmailCode,
  sendPasswordReset,
  testConnection,
  getEmailConfig
};
