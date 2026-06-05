/**
 * 分享路由
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { db } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 获取我的分享
router.get('/', async (req, res) => {
  try {
    const user = req.user;

    const shares = await db.asyncAll(
      `SELECT s.*, f.original_name as file_name, f.size as file_size 
       FROM shares s 
       LEFT JOIN files f ON s.file_id = f.id 
       WHERE s.account_id = ? 
       ORDER BY s.created_at DESC`,
      [user.id]
    );

    const formattedShares = shares.map(share => ({
      id: share.id,
      fileId: share.file_id,
      fileName: share.file_name,
      fileSize: share.file_size,
      shareCode: share.share_code,
      expiresAt: share.expires_at,
      maxDownloads: share.max_downloads,
      downloadCount: share.download_count,
      hasPassword: !!share.password_hash,
      createdAt: share.created_at
    }));

    res.apiSuccess(formattedShares);
  } catch (error) {
    console.error('获取分享列表错误:', error);
    res.apiError('获取分享列表失败', 'GET_SHARES_ERROR');
  }
});

// 创建分享
router.post('/files/:fileId', async (req, res) => {
  try {
    const user = req.user;
    const { fileId } = req.params;
    const { expiresIn, expiresAt, maxDownloads, password } = req.body;

    // 检查文件是否存在
    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [fileId, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 检查是否已存在该文件的分享
    const existingShare = await db.asyncGet(
      'SELECT * FROM shares WHERE file_id = ? AND account_id = ?',
      [fileId, user.id]
    );

    // 生成分享码
    const shareCode = crypto.randomBytes(8).toString('hex');

    // 计算过期时间
    let finalExpiresAt = null;
    if (expiresAt) {
      // 如果提供了具体的日期
      finalExpiresAt = new Date(expiresAt);
    } else if (expiresIn) {
      // 如果提供了秒数
      finalExpiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // 哈希密码
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    let shareId = null;
    if (existingShare) {
      // 如果已存在分享，更新现有分享
      await db.asyncRun(
        'UPDATE shares SET share_code = ?, expires_at = ?, max_downloads = ?, password_hash = ?, download_count = 0 WHERE id = ?',
        [shareCode, finalExpiresAt, maxDownloads || null, passwordHash, existingShare.id]
      );
      shareId = existingShare.id;
    } else {
      // 创建新分享
      const result = await db.asyncRun(
        'INSERT INTO shares (file_id, account_id, share_code, expires_at, max_downloads, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [fileId, user.id, shareCode, finalExpiresAt, maxDownloads || null, passwordHash]
      );
      shareId = result.lastID;
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'CREATE_SHARE', req.ip]
    );

    const share = {
      id: shareId,
      fileId,
      shareCode,
      expiresAt: finalExpiresAt,
      maxDownloads,
      hasPassword: !!passwordHash,
      isNew: !existingShare
    };

    res.apiSuccess(share, existingShare ? '分享已更新' : '分享创建成功');
  } catch (error) {
    console.error('创建分享错误:', error);
    res.apiError('创建分享失败', 'CREATE_SHARE_ERROR');
  }
});

// 更新分享
router.put('/:id', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { expiresIn, expiresAt, maxDownloads, password } = req.body;

    // 获取现有分享
    const existingShare = await db.asyncGet(
      'SELECT * FROM shares WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!existingShare) {
      return res.apiError('分享不存在', 'SHARE_NOT_FOUND');
    }

    let finalExpiresAt = existingShare.expires_at;
    if (expiresAt !== undefined) {
      finalExpiresAt = expiresAt ? new Date(expiresAt) : null;
    } else if (expiresIn) {
      finalExpiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    // 如果提供了新密码，则更新密码
    let passwordHash = existingShare.password_hash;
    if (password !== undefined) {
      if (password === null || password === '') {
        passwordHash = null;
      } else {
        passwordHash = await bcrypt.hash(password, 10);
      }
    }

    const result = await db.asyncRun(
      'UPDATE shares SET expires_at = ?, max_downloads = ?, password_hash = ? WHERE id = ? AND account_id = ?',
      [finalExpiresAt, maxDownloads || null, passwordHash, id, user.id]
    );

    res.apiSuccess(null, '分享已更新');
  } catch (error) {
    console.error('更新分享错误:', error);
    res.apiError('更新分享失败', 'UPDATE_SHARE_ERROR');
  }
});

// 删除分享
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const result = await db.asyncRun(
      'DELETE FROM shares WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (result.changes === 0) {
      return res.apiError('分享不存在', 'SHARE_NOT_FOUND');
    }

    res.apiSuccess(null, '分享已删除');
  } catch (error) {
    console.error('删除分享错误:', error);
    res.apiError('删除分享失败', 'DELETE_SHARE_ERROR');
  }
});

// 获取公开分享信息
router.get('/public/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const share = await db.asyncGet(
      `SELECT s.*, f.original_name, f.size, f.filepath, f.mime_type 
       FROM shares s 
       LEFT JOIN files f ON s.file_id = f.id 
       WHERE s.share_code = ?`,
      [code]
    );

    if (!share) {
      return res.apiError('分享不存在', 'SHARE_NOT_FOUND');
    }

    // 检查是否过期
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.apiError('分享已过期', 'SHARE_EXPIRED');
    }

    // 检查下载次数
    if (share.max_downloads && share.download_count >= share.max_downloads) {
      return res.apiError('下载次数已用完', 'DOWNLOAD_LIMIT_REACHED');
    }

    const shareInfo = {
      fileName: share.original_name,
      fileSize: share.size,
      mimeType: share.mime_type,
      expiresAt: share.expires_at,
      maxDownloads: share.max_downloads,
      downloadCount: share.download_count,
      hasPassword: !!share.password_hash,
      createdAt: share.created_at
    };

    res.apiSuccess(shareInfo);
  } catch (error) {
    console.error('获取分享信息错误:', error);
    res.apiError('获取分享信息失败', 'GET_SHARE_INFO_ERROR');
  }
});

// 下载分享文件
router.post('/public/:code/download', async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body;

    const share = await db.asyncGet(
      `SELECT s.*, f.original_name, f.filepath 
       FROM shares s 
       LEFT JOIN files f ON s.file_id = f.id 
       WHERE s.share_code = ?`,
      [code]
    );

    if (!share) {
      return res.apiError('分享不存在', 'SHARE_NOT_FOUND');
    }

    // 检查是否过期
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.apiError('分享已过期', 'SHARE_EXPIRED');
    }

    // 检查下载次数
    if (share.max_downloads && share.download_count >= share.max_downloads) {
      return res.apiError('下载次数已用完', 'DOWNLOAD_LIMIT_REACHED');
    }

    // 检查密码
    if (share.password_hash) {
      if (!password) {
        return res.apiError('需要密码', 'PASSWORD_REQUIRED');
      }
      const isValidPassword = await bcrypt.compare(password, share.password_hash);
      if (!isValidPassword) {
        return res.apiError('密码错误', 'INVALID_PASSWORD');
      }
    }

    // 检查文件是否存在
    if (!share.filepath || !fs.existsSync(share.filepath)) {
      return res.apiError('文件已失效', 'FILE_MISSING');
    }

    // 增加下载次数
    await db.asyncRun(
      'UPDATE shares SET download_count = download_count + 1 WHERE id = ?',
      [share.id]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [share.account_id, 'DOWNLOAD_SHARE', req.ip]
    );

    // 发送文件
    res.download(share.filepath, share.original_name);
  } catch (error) {
    console.error('下载分享文件错误:', error);
    res.apiError('下载失败', 'DOWNLOAD_SHARE_ERROR');
  }
});

module.exports = router;
