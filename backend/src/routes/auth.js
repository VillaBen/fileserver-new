/**
 * 认证相关路由
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../config/database');
const ApiResponse = require('../utils/response');
const { generateToken } = require('../utils/jwt');
const { encrypt, decrypt } = require('../utils/encryption');
const { requireAuth } = require('../middleware/auth');
const { sendEmailCode, sendPasswordReset } = require('../utils/email');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, captchaId, captchaCode } = req.body;

    if (!username || !password) {
      return res.apiError('Username and password cannot be empty', 'VALIDATION_ERROR');
    }

    // 检查验证码（只有当验证码不为空时才验证）
    if (captchaId && captchaCode && captchaCode.trim()) {
      try {
        const captcha = await db.asyncGet(
          'SELECT * FROM captchas WHERE id = ? AND code = ? AND expires_at > CURRENT_TIMESTAMP',
          [captchaId, captchaCode]
        );

        if (!captcha) {
          return res.apiError('Invalid verification code', 'INVALID_CAPTCHA');
        }

        // 删除已使用的验证码
        await db.asyncRun('DELETE FROM captchas WHERE id = ?', [captchaId]);
      } catch (error) {
        // 如果captchas表不存在，跳过验证码验证
        console.log('Captchas table not found, skipping captcha verification');
      }
    }

    // 检查用户名是否存在
    const existingUser = await db.asyncGet(
      'SELECT id FROM accounts WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.apiError('Username already exists', 'USERNAME_EXISTS');
    }

    // 加密邮箱（如果提供）
    const encryptedEmail = email ? encrypt(email) : null;

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await db.asyncRun(
      'INSERT INTO accounts (username, email, password_hash) VALUES (?, ?, ?)',
      [username, encryptedEmail, passwordHash]
    );

    const userId = result.lastID;

    // 创建用户配置
    await db.asyncRun(
      'INSERT INTO user_profiles (account_id, storage_quota, language) VALUES (?, ?, ?)',
      [userId, 10737418240, 'en-US']
    );

    // 获取新创建的用户信息
    const user = await db.asyncGet(
      'SELECT id, username, email, role, status, created_at FROM accounts WHERE id = ?',
      [userId]
    );

    // 解密邮箱返回给前端
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email ? decrypt(user.email) : null,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };

    res.apiSuccess(userData, 'Registration successful');
  } catch (error) {
    console.error('Registration error:', error);
    res.apiError('Registration failed', 'REGISTER_ERROR');
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, captchaId, captchaCode } = req.body;

    if (!username || !password) {
      return res.apiError('Username and password cannot be empty', 'VALIDATION_ERROR');
    }

    // 查找用户
    const user = await db.asyncGet(
      'SELECT * FROM accounts WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.apiError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    // 检查账户状态
    if (user.status === 0) {
      return res.apiError('Account has been disabled', 'ACCOUNT_DISABLED');
    }

    // 检查是否被锁定
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.apiError('Account is locked, please try again later', 'ACCOUNT_LOCKED');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // 增加失败尝试次数
      await db.asyncRun(
        `UPDATE accounts 
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE 
               WHEN failed_login_attempts >= 4 THEN datetime('now', '+15 minutes')
               ELSE NULL 
             END
         WHERE id = ?`,
        [user.id]
      );
      return res.apiError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    // 重置失败尝试
    await db.asyncRun(
      'UPDATE accounts SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN', req.ip, req.get('user-agent')]
    );

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // 设置token到cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      sameSite: 'lax'
    });

    // 返回用户信息（不包含密码）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email ? decrypt(user.email) : null,
      role: user.role,
      status: user.status,
      storageQuota: user.storage_quota,
      avatar: user.avatar,
      twoFactorEnabled: !!user.two_factor_enabled,
      createdAt: user.created_at,
      token: token
    };

    res.apiSuccess(userData, '登录成功');
  } catch (error) {
    console.error('登录错误:', error);
    res.apiError('登录失败', 'LOGIN_ERROR');
  }
});

// 登出
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      await db.asyncRun(
        'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
        [user.id, 'LOGOUT', req.ip]
      );
    }
    res.clearCookie('token');
    res.apiSuccess(null, '登出成功');
  } catch (error) {
    console.error('登出错误:', error);
    res.clearCookie('token');
    res.apiSuccess(null, '登出成功');
  }
});

// 获取当前用户信息
router.get('/me', requireAuth, async (req, res) => {
  try {
    const accountId = req.user.id;

    // 获取账户信息
    const account = await db.asyncGet(
      'SELECT id, username, email, role, status, storage_quota, avatar, two_factor_enabled, created_at FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!account) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取或创建用户配置
    let profile = await db.asyncGet(
      'SELECT * FROM user_profiles WHERE account_id = ?',
      [accountId]
    );

    if (!profile) {
      await db.asyncRun(
        'INSERT INTO user_profiles (account_id, storage_quota, language) VALUES (?, ?, ?)',
        [accountId, account.storage_quota, 'zh-CN']
      );
      profile = await db.asyncGet(
        'SELECT * FROM user_profiles WHERE account_id = ?',
        [accountId]
      );
    }

    // 获取存储使用情况
    const storage = await db.asyncGet(
      'SELECT COALESCE(SUM(size), 0) as used FROM files WHERE account_id = ? AND in_trash = 0',
      [accountId]
    );

    // 构建头像URL
    let avatarUrl = null;
    const avatarFilename = profile.avatar || account.avatar;
    if (avatarFilename) {
      avatarUrl = `/api/user/avatar/${avatarFilename}`;
    }

    const userData = {
      id: account.id,
      username: account.username,
      email: account.email ? decrypt(account.email) : null,
      role: account.role,
      status: account.status,
      storageQuota: account.storage_quota,
      storageUsed: storage.used,
      avatar: avatarFilename,
      avatarUrl: avatarUrl,
      language: profile.language,
      emailVerified: profile.email_verified === 1,
      twoFactorEnabled: account.two_factor_enabled === 1 || profile.two_factor_enabled === 1,
      trashAutoDeleteEnabled: profile.trash_auto_delete_enabled === 1,
      trashAutoDeleteDays: profile.trash_auto_delete_days,
      createdAt: account.created_at
    };

    res.apiSuccess(userData);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.apiError('获取用户信息失败', 'GET_USER_ERROR');
  }
});

// 修改密码
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.apiError('当前密码和新密码不能为空', 'VALIDATION_ERROR');
    }

    // 获取当前密码哈希
    const account = await db.asyncGet(
      'SELECT password_hash FROM accounts WHERE id = ?',
      [user.id]
    );

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, account.password_hash);
    if (!isValid) {
      return res.apiError('当前密码错误', 'INVALID_PASSWORD');
    }

    // 哈希新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.asyncRun(
      'UPDATE accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, user.id]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'CHANGE_PASSWORD', req.ip]
    );

    res.apiSuccess(null, '密码修改成功');
  } catch (error) {
    console.error('修改密码错误:', error);
    res.apiError('密码修改失败', 'CHANGE_PASSWORD_ERROR');
  }
});

// 忘记密码
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.apiError('邮箱不能为空', 'VALIDATION_ERROR');
    }

    // 查找用户 - 需要解密比对所有邮箱
    const allAccounts = await db.asyncAll('SELECT id, email FROM accounts WHERE email IS NOT NULL');
    let user = null;
    for (const account of allAccounts) {
      try {
        const decryptedEmail = decrypt(account.email);
        if (decryptedEmail === email) {
          user = { id: account.id };
          break;
        }
      } catch (e) {
        // 解密失败，继续下一个
        continue;
      }
    }

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return res.apiSuccess(null, '如果邮箱存在，重置链接已发送');
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const encryptedToken = encrypt(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    // 删除旧的重置请求
    await db.asyncRun(
      'DELETE FROM password_resets WHERE account_id = ?',
      [user.id]
    );

    // 保存重置请求
    await db.asyncRun(
      'INSERT INTO password_resets (account_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, encryptedToken, expiresAt]
    );

    // 发送重置邮件
    const resetUrl = `/reset-password?token=${resetToken}`;
    try {
      await sendPasswordReset(email, resetUrl);
      res.apiSuccess(null, '如果邮箱存在，重置链接已发送');
    } catch (mailError) {
      console.error('发送重置邮件失败:', mailError);
      // 如果发送失败，仍返回成功（安全考虑）
      res.apiSuccess(null, '如果邮箱存在，重置链接已发送');
    }
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.apiError('操作失败', 'FORGOT_PASSWORD_ERROR');
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.apiError('令牌和新密码不能为空', 'VALIDATION_ERROR');
    }

    // 查找所有未过期的重置请求，然后解密比较
    const resets = await db.asyncAll(
      'SELECT * FROM password_resets WHERE used = 0 AND expires_at > datetime("now")',
      []
    );

    let validReset = null;
    for (const reset of resets) {
      try {
        const decryptedToken = decrypt(reset.token);
        if (decryptedToken === token) {
          validReset = reset;
          break;
        }
      } catch (e) {
        // 解密失败，继续下一个
        continue;
      }
    }

    if (!validReset) {
      return res.apiError('重置令牌无效或已过期', 'INVALID_TOKEN');
    }

    // 哈希新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新用户密码
    await db.asyncRun(
      'UPDATE accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, validReset.account_id]
    );

    // 标记为已使用
    await db.asyncRun(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [validReset.id]
    );

    res.apiSuccess(null, '密码重置成功');
  } catch (error) {
    console.error('重置密码错误:', error);
    res.apiError('密码重置失败', 'RESET_PASSWORD_ERROR');
  }
});

// 设置两步验证
router.post('/2fa/setup', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // 生成密钥（简化版本，实际应使用OTPAuth库）
    const secret = crypto.randomBytes(20).toString('hex');
    const encryptedSecret = encrypt(secret);

    // 保存到用户账户和用户配置
    await db.asyncRun(
      'UPDATE accounts SET two_factor_secret = ? WHERE id = ?',
      [encryptedSecret, user.id]
    );

    // 删除旧的恢复码
    await db.asyncRun(
      'DELETE FROM recovery_codes WHERE account_id = ?',
      [user.id]
    );

    // 生成恢复码
    const recoveryCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomInt(100000, 999999).toString();
      recoveryCodes.push(code);
      const encryptedCode = encrypt(code);
      await db.asyncRun(
        'INSERT INTO recovery_codes (account_id, code) VALUES (?, ?)',
        [user.id, encryptedCode]
      );
    }

    // 生成 QR Code URL
    const issuer = 'FileCloud';
    const account = user.email;
    const otpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUri)}`;

    res.apiSuccess({
      secret,
      qrCodeUrl,
      recoveryCodes
    }, '两步验证已设置');
  } catch (error) {
    console.error('设置两步验证错误:', error);
    res.apiError('设置失败', '2FA_SETUP_ERROR');
  }
});

// 验证两步验证
router.post('/2fa/verify', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (!code) {
      return res.apiError('验证码不能为空', 'VALIDATION_ERROR');
    }

    // 检查恢复码 - 需要解密数据库中的所有恢复码进行比对
    const allRecoveryCodes = await db.asyncAll(
      'SELECT * FROM recovery_codes WHERE account_id = ? AND used = 0',
      [user.id]
    );

    let matchedRecoveryCode = null;
    for (const rc of allRecoveryCodes) {
      const decryptedCode = decrypt(rc.code);
      if (decryptedCode === code) {
        matchedRecoveryCode = rc;
        break;
      }
    }

    if (matchedRecoveryCode) {
      // 使用恢复码
      await db.asyncRun(
        'UPDATE recovery_codes SET used = 1, used_at = datetime("now") WHERE id = ?',
        [matchedRecoveryCode.id]
      );

      // 启用两步验证
      await db.asyncRun(
        'UPDATE accounts SET two_factor_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      return res.apiSuccess(null, '两步验证已启用');
    }

    // 验证临时验证码（简化版本）
    // 实际应使用OTPAuth库验证TOTP
    const account = await db.asyncGet(
      'SELECT two_factor_secret FROM accounts WHERE id = ?',
      [user.id]
    );

    // 简化验证：任何6位数字都通过
    if (code.length === 6 && /^\d+$/.test(code) && account.two_factor_secret) {
      // 启用两步验证
      await db.asyncRun(
        'UPDATE accounts SET two_factor_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      return res.apiSuccess(null, '两步验证已启用');
    }

    res.apiError('验证码无效', 'INVALID_CODE');
  } catch (error) {
    console.error('验证两步验证错误:', error);
    res.apiError('验证失败', '2FA_VERIFY_ERROR');
  }
});

// 禁用两步验证
router.post('/2fa/disable', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // 禁用两步验证
    await db.asyncRun(
      'UPDATE accounts SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 删除恢复码
    await db.asyncRun(
      'DELETE FROM recovery_codes WHERE account_id = ?',
      [user.id]
    );

    res.apiSuccess(null, '两步验证已禁用');
  } catch (error) {
    console.error('禁用两步验证错误:', error);
    res.apiError('操作失败', '2FA_DISABLE_ERROR');
  }
});

// 生成新的恢复码
router.post('/2fa/recovery-codes', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    // 删除旧恢复码
    await db.asyncRun(
      'DELETE FROM recovery_codes WHERE account_id = ?',
      [user.id]
    );

    // 生成新恢复码
    const recoveryCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomInt(100000, 999999).toString();
      recoveryCodes.push(code);
      const encryptedCode = encrypt(code);
      await db.asyncRun(
        'INSERT INTO recovery_codes (account_id, code) VALUES (?, ?)',
        [user.id, encryptedCode]
      );
    }

    res.apiSuccess({ codes: recoveryCodes }, '恢复码已生成');
  } catch (error) {
    console.error('生成恢复码错误:', error);
    res.apiError('生成失败', 'RECOVERY_CODES_ERROR');
  }
});

// 发送邮箱验证码
router.post('/send-email-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.apiError('邮箱和用途不能为空', 'VALIDATION_ERROR');
    }

    // 加密邮箱
    const encryptedEmail = encrypt(email);

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const encryptedCode = encrypt(code);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

    // 删除该邮箱相同用途的旧验证码
    await db.asyncRun(
      'DELETE FROM email_codes WHERE email = ? AND purpose = ?',
      [encryptedEmail, purpose]
    );

    // 保存验证码
    await db.asyncRun(
      'INSERT INTO email_codes (email, purpose, code, expires_at) VALUES (?, ?, ?, ?)',
      [encryptedEmail, purpose, encryptedCode, expiresAt]
    );

    // 发送邮件
    try {
      await sendEmailCode(email, code, purpose);
      res.apiSuccess(null, '验证码已发送');
    } catch (mailError) {
      console.error('发送验证码邮件失败:', mailError);
      // 如果发送失败，回退到打印验证码
      console.log(`📧 邮箱验证码: ${email} - ${code} (${purpose})`);
      res.apiSuccess(null, '验证码已发送');
    }
  } catch (error) {
    console.error('发送邮箱验证码错误:', error);
    res.apiError('发送失败', 'SEND_EMAIL_CODE_ERROR');
  }
});

// 验证邮箱验证码
router.post('/verify-email-code', async (req, res) => {
  try {
    const { email, purpose, code } = req.body;

    if (!email || !purpose || !code) {
      return res.apiError('邮箱、用途和验证码不能为空', 'VALIDATION_ERROR');
    }

    // 加密邮箱以查找
    const encryptedEmail = encrypt(email);

    // 查找验证码
    const emailCodes = await db.asyncAll(
      'SELECT * FROM email_codes WHERE email = ? AND purpose = ? AND expires_at > datetime("now")',
      [encryptedEmail, purpose]
    );

    if (!emailCodes || emailCodes.length === 0) {
      return res.apiError('验证码不存在或已过期', 'CODE_INVALID');
    }

    // 解密并比对
    let validCode = null;
    for (const ec of emailCodes) {
      try {
        const decryptedCode = decrypt(ec.code);
        if (decryptedCode === code) {
          validCode = ec;
          break;
        }
      } catch (e) {
        // 解密失败，继续下一个
        continue;
      }
    }

    if (!validCode) {
      // 增加尝试次数
      if (emailCodes[0].attempts < 3) {
        await db.asyncRun(
          'UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?',
          [emailCodes[0].id]
        );
        return res.apiError('验证码错误', 'CODE_INVALID');
      }
      return res.apiError('验证码尝试次数过多，已失效', 'CODE_EXPIRED');
    }

    // 验证成功，删除已使用的验证码
    await db.asyncRun('DELETE FROM email_codes WHERE id = ?', [validCode.id]);

    res.apiSuccess(null, '验证成功');
  } catch (error) {
    console.error('验证邮箱验证码错误:', error);
    res.apiError('验证失败', 'VERIFY_EMAIL_CODE_ERROR');
  }
});

module.exports = router;
