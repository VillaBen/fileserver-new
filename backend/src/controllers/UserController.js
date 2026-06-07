/**
 * 用户控制器
 */

const { db } = require('../config/database.adapter');
const { encrypt, decrypt, hashPassword, verifyPassword } = require('../utils/encryption');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * 获取用户资料
 */
const getProfile = async (req, res) => {
  try {
    const accountId = req.user.id;
    
    console.log('[Backend-getProfile] 1. 收到请求, accountId:', accountId);

    // 获取账户信息
    const account = await db.asyncGet(
      'SELECT id, username, email, role, status, storage_quota, avatar, two_factor_enabled, created_at FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!account) {
      console.log('[Backend-getProfile] 2. 用户不存在');
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    console.log('[Backend-getProfile] 3. 账户信息:', account);

    // 获取或创建用户配置
    let profile = await db.asyncGet(
      'SELECT * FROM user_profiles WHERE account_id = ?',
      [accountId]
    );

    if (!profile) {
      console.log('[Backend-getProfile] 4. 创建新的用户配置');
      await db.asyncRun(
        'INSERT INTO user_profiles (account_id, storage_quota, language) VALUES (?, ?, ?)',
        [accountId, account.storage_quota, 'zh-CN']
      );
      profile = await db.asyncGet(
        'SELECT * FROM user_profiles WHERE account_id = ?',
        [accountId]
      );
    }
    
    console.log('[Backend-getProfile] 5. 用户配置:', profile);

    // 获取存储使用情况
    const storage = await db.asyncGet(
      'SELECT COALESCE(SUM(size), 0) as used FROM files WHERE account_id = ? AND in_trash = 0',
      [accountId]
    );

    // 构建头像URL
    let avatarUrl = null;
    const avatarFilename = profile.avatar || account.avatar;
    console.log('[Backend-getProfile] 6. 头像文件名:', avatarFilename);
    
    if (avatarFilename) {
      // 使用API路径返回头像，绕过静态文件路径限制
      avatarUrl = `/api/user/avatar/${avatarFilename}`;
    }
    
    console.log('[Backend-getProfile] 7. 头像URL:', avatarUrl);

    const userData = {
      id: account.id,
      username: account.username,
      email: account.email ? decrypt(account.email) : null,
      role: account.role,
      status: account.status,
      storageQuota: account.storage_quota,
      storageUsed: storage.used,
      storageAvailable: account.storage_quota - storage.used,
      avatar: avatarFilename,
      avatarUrl: avatarUrl,
      language: profile.language,
      emailVerified: profile.email_verified === 1,
      twoFactorEnabled: account.two_factor_enabled === 1 || profile.two_factor_enabled === 1,
      trashAutoDeleteEnabled: profile.trash_auto_delete_enabled === 1,
      trashAutoDeleteDays: profile.trash_auto_delete_days,
      createdAt: account.created_at
    };
    
    console.log('[Backend-getProfile] 8. 返回的用户数据:', userData);

    res.apiSuccess(userData);
  } catch (error) {
    console.error('[Backend-getProfile] 9. 获取用户资料错误:', error);
    res.apiError('获取用户资料失败', 'GET_PROFILE_ERROR');
  }
};

/**
 * 更新用户资料
 */
const updateProfile = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { language, trashAutoDeleteEnabled, trashAutoDeleteDays, displayName } = req.body;

    const updates = {};
    if (language !== undefined) {
      updates.language = language;
    }
    if (trashAutoDeleteEnabled !== undefined) {
      updates.trash_auto_delete_enabled = trashAutoDeleteEnabled ? 1 : 0;
    }
    if (trashAutoDeleteDays !== undefined) {
      updates.trash_auto_delete_days = trashAutoDeleteDays;
    }

    if (Object.keys(updates).length > 0) {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(accountId);

      await db.asyncRun(
        `UPDATE user_profiles SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?`,
        values
      );
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [accountId, 'update_profile', req.ip, JSON.stringify(updates)]
    );

    res.apiSuccess(null, '资料更新成功');
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.apiError('更新资料失败', 'UPDATE_PROFILE_ERROR');
  }
};

/**
 * 获取存储信息
 */
const getStorageInfo = async (req, res) => {
  try {
    const accountId = req.user.id;

    const account = await db.asyncGet(
      'SELECT storage_quota FROM accounts WHERE id = ?',
      [accountId]
    );

    const storage = await db.asyncGet(
      'SELECT COALESCE(SUM(size), 0) as used FROM files WHERE account_id = ? AND in_trash = 0',
      [accountId]
    );

    res.apiSuccess({
      quota: account.storage_quota,
      used: storage.used,
      total: account.storage_quota,
      available: account.storage_quota - storage.used
    });
  } catch (error) {
    console.error('获取存储信息错误:', error);
    res.apiError('获取存储信息失败', 'GET_STORAGE_ERROR');
  }
};

/**
 * 设置安全问题
 */
const setSecurityQuestion = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.apiError('问题和答案都不能为空', 'VALIDATION_ERROR');
    }

    const answerHash = await hashPassword(answer);

    await db.asyncRun(
      `UPDATE user_profiles 
       SET security_question = ?, security_answer_hash = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE account_id = ?`,
      [question, answerHash, accountId]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [accountId, 'set_security_question', req.ip]
    );

    res.apiSuccess(null, '安全问题设置成功');
  } catch (error) {
    console.error('设置安全问题错误:', error);
    res.apiError('设置安全问题失败', 'SET_SECURITY_QUESTION_ERROR');
  }
};

/**
 * 验证安全问题
 */
const verifySecurityQuestion = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { answer } = req.body;

    const profile = await db.asyncGet(
      'SELECT security_answer_hash FROM user_profiles WHERE account_id = ?',
      [accountId]
    );

    if (!profile || !profile.security_answer_hash) {
      return res.apiError('未设置安全问题', 'NO_SECURITY_QUESTION');
    }

    const isValid = await verifyPassword(answer, profile.security_answer_hash);
    if (!isValid) {
      return res.apiError('答案错误', 'INVALID_ANSWER');
    }

    res.apiSuccess(null, '验证成功');
  } catch (error) {
    console.error('验证安全问题错误:', error);
    res.apiError('验证失败', 'VERIFY_SECURITY_QUESTION_ERROR');
  }
};

/**
 * 上传头像
 */
const uploadAvatar = async (req, res) => {
  try {
    const accountId = req.user.id;
    const file = req.file;

    console.log('[Backend-Avatar] 1. 收到上传请求, accountId:', accountId);
    console.log('[Backend-Avatar] 2. 文件信息:', file);

    if (!file) {
      console.log('[Backend-Avatar] 3. 没有文件');
      return res.apiError('请上传文件', 'NO_FILE_PROVIDED');
    }

    if (!file.mimetype.startsWith('image/')) {
      console.log('[Backend-Avatar] 4. 文件类型不正确:', file.mimetype);
      return res.apiError('只能上传图片文件', 'INVALID_FILE_TYPE');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('[Backend-Avatar] 5. 文件太大:', file.size);
      return res.apiError('头像大小不能超过5MB', 'FILE_TOO_LARGE');
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('[Backend-Avatar] 6. 创建上传目录');
    }

    const fileExtension = path.extname(file.originalname);
    const filename = `avatar-${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    console.log('[Backend-Avatar] 7. 保存文件到:', filePath);
    fs.writeFileSync(filePath, file.buffer);
    console.log('[Backend-Avatar] 8. 文件已保存');

    // 删除旧头像
    const profile = await db.asyncGet(
      'SELECT avatar FROM user_profiles WHERE account_id = ?',
      [accountId]
    );
    console.log('[Backend-Avatar] 9. 旧头像信息:', profile);
    
    if (profile && profile.avatar) {
      const oldAvatarPath = path.join(uploadDir, profile.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        console.log('[Backend-Avatar] 10. 删除旧头像:', oldAvatarPath);
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 更新头像
    console.log('[Backend-Avatar] 11. 更新数据库, filename:', filename);
    await db.asyncRun(
      'UPDATE user_profiles SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
      [filename, accountId]
    );
    console.log('[Backend-Avatar] 12. 数据库已更新');

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [accountId, 'upload_avatar', req.ip, JSON.stringify({ filename })]
    );

    const responseData = { avatar: filename, avatarUrl: `/api/user/avatar/${filename}` };
    console.log('[Backend-Avatar] 13. 返回数据:', responseData);
    res.apiSuccess(responseData, '头像上传成功');
  } catch (error) {
    console.error('[Backend-Avatar] 14. 上传失败:', error);
    res.apiError('上传头像失败', 'UPLOAD_AVATAR_ERROR');
  }
};

/**
 * 删除头像
 */
const deleteAvatar = async (req, res) => {
  try {
    const accountId = req.user.id;

    const profile = await db.asyncGet(
      'SELECT avatar FROM user_profiles WHERE account_id = ?',
      [accountId]
    );

    if (profile && profile.avatar) {
      const uploadDir = path.join(__dirname, '../../uploads');
      const avatarPath = path.join(uploadDir, profile.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }

      await db.asyncRun(
        'UPDATE user_profiles SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
        [accountId]
      );
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [accountId, 'delete_avatar', req.ip]
    );

    res.apiSuccess(null, '头像删除成功');
  } catch (error) {
    console.error('删除头像错误:', error);
    res.apiError('删除头像失败', 'DELETE_AVATAR_ERROR');
  }
};

/**
 * 获取头像文件
 * 通过API返回头像文件，绕过静态文件路径限制
 */
const getAvatarFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log('[Backend-getAvatarFile] 1. 收到请求, filename:', filename);
    
    // 安全检查：确保文件名格式正确
    if (!filename || !filename.startsWith('avatar-') || !filename.endsWith('.png') && !filename.endsWith('.jpg') && !filename.endsWith('.jpeg') && !filename.endsWith('.gif')) {
      console.log('[Backend-getAvatarFile] 2. 文件名格式不正确');
      return res.status(400).send('Invalid filename');
    }
    
    const uploadDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadDir, filename);
    
    console.log('[Backend-getAvatarFile] 3. 文件路径:', filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log('[Backend-getAvatarFile] 4. 文件不存在');
      return res.status(404).send('File not found');
    }
    
    console.log('[Backend-getAvatarFile] 5. 文件存在，开始发送');
    
    // 设置正确的Content-Type
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif'
    }[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天
    
    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log('[Backend-getAvatarFile] 6. 文件发送完成');
  } catch (error) {
    console.error('[Backend-getAvatarFile] 7. 获取头像文件错误:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStorageInfo,
  setSecurityQuestion,
  verifySecurityQuestion,
  uploadAvatar,
  deleteAvatar,
  getAvatarFile
};
