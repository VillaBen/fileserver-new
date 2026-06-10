/**
 * 用户安全路由
 * - 安全问题设置/验证
 * - 信任设备管理
 * - 登录日志
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../config/database.adapter');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================
// 安全问题
// ==========================

// 获取安全问题（已设置时只返回问题，不返回答案）
router.get('/security-question', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await db.asyncGet(
      'SELECT security_question FROM user_profiles WHERE account_id = ?',
      [userId]
    );
    res.apiSuccess({
      hasQuestion: !!(profile && profile.security_question),
      question: profile ? profile.security_question : null
    });
  } catch (error) {
    console.error('获取安全问题错误:', error);
    res.apiError('获取失败', 'SECURITY_QUESTION_ERROR');
  }
});

// 设置安全问题
router.post('/security-question', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.apiError('安全问题和答案不能为空', 'VALIDATION_ERROR');
    }

    // 规范化答案：去掉前后空格并转小写
    const hashedAnswer = await bcrypt.hash(answer.trim().toLowerCase(), 10);

    const existing = await db.asyncGet(
      'SELECT id FROM user_profiles WHERE account_id = ?',
      [userId]
    );

    if (existing) {
      await db.asyncRun(
        'UPDATE user_profiles SET security_question = ?, security_answer_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
        [question, hashedAnswer, userId]
      );
    } else {
      await db.asyncRun(
        'INSERT INTO user_profiles (account_id, security_question, security_answer_hash) VALUES (?, ?, ?)',
        [userId, question, hashedAnswer]
      );
    }

    // 记录通知
    await db.asyncRun(
      'INSERT INTO notifications (account_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, 'security', '安全问题已设置', '您的账户安全问题已成功设置']
    );

    res.apiSuccess(null, '安全问题设置成功');
  } catch (error) {
    console.error('设置安全问题错误:', error);
    res.apiError('设置失败', 'SECURITY_QUESTION_ERROR');
  }
});

// 修改安全问题（需验证旧答案）
router.put('/security-question', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentAnswer, newQuestion, newAnswer } = req.body;

    if (!currentAnswer || !newQuestion || !newAnswer) {
      return res.apiError('旧答案、新问题和新答案均不能为空', 'VALIDATION_ERROR');
    }

    const profile = await db.asyncGet(
      'SELECT security_answer_hash FROM user_profiles WHERE account_id = ?',
      [userId]
    );

    if (!profile || !profile.security_answer_hash) {
      return res.apiError('您还未设置安全问题', 'NO_SECURITY_QUESTION');
    }

    const isValid = await bcrypt.compare(currentAnswer.trim().toLowerCase(), profile.security_answer_hash);
    if (!isValid) {
      return res.apiError('旧答案不正确', 'WRONG_ANSWER');
    }

    const newHashedAnswer = await bcrypt.hash(newAnswer.trim().toLowerCase(), 10);
    await db.asyncRun(
      'UPDATE user_profiles SET security_question = ?, security_answer_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
      [newQuestion, newHashedAnswer, userId]
    );

    res.apiSuccess(null, '安全问题已更新');
  } catch (error) {
    console.error('更新安全问题错误:', error);
    res.apiError('更新失败', 'SECURITY_QUESTION_ERROR');
  }
});

// 清除安全问题
router.delete('/security-question', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { answer } = req.body;

    if (!answer) {
      return res.apiError('请提供安全答案进行验证', 'VALIDATION_ERROR');
    }

    const profile = await db.asyncGet(
      'SELECT security_answer_hash FROM user_profiles WHERE account_id = ?',
      [userId]
    );

    if (!profile || !profile.security_answer_hash) {
      return res.apiError('您还未设置安全问题', 'NO_SECURITY_QUESTION');
    }

    const isValid = await bcrypt.compare(answer.trim().toLowerCase(), profile.security_answer_hash);
    if (!isValid) {
      return res.apiError('答案不正确', 'WRONG_ANSWER');
    }

    await db.asyncRun(
      'UPDATE user_profiles SET security_question = NULL, security_answer_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
      [userId]
    );

    res.apiSuccess(null, '安全问题已清除');
  } catch (error) {
    console.error('清除安全问题错误:', error);
    res.apiError('清除失败', 'SECURITY_QUESTION_ERROR');
  }
});

// ==========================
// 信任设备
// ==========================

// 获取信任设备列表
router.get('/trusted-devices', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await db.asyncAll(
      'SELECT id, device_name, device_type, user_agent, ip_address, location, last_login_at, created_at, expires_at FROM trusted_devices WHERE account_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.apiSuccess(devices);
  } catch (error) {
    console.error('获取信任设备错误:', error);
    res.apiError('获取失败', 'TRUSTED_DEVICES_ERROR');
  }
});

// 添加信任设备
router.post('/trusted-devices', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceName, deviceType, userAgent, location } = req.body;

    if (!deviceName) {
      return res.apiError('设备名称不能为空', 'VALIDATION_ERROR');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 天过期

    await db.asyncRun(
      'INSERT INTO trusted_devices (account_id, device_name, device_type, user_agent, ip_address, location, token, last_login_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
      [
        userId,
        deviceName,
        deviceType || 'unknown',
        userAgent || '',
        req.ip || '',
        location || '',
        token,
        expiresAt.toISOString()
      ]
    );

    res.apiSuccess({ token }, '设备已添加到信任列表');
  } catch (error) {
    console.error('添加信任设备错误:', error);
    res.apiError('添加失败', 'TRUSTED_DEVICES_ERROR');
  }
});

// 移除信任设备
router.delete('/trusted-devices/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceId = req.params.id;

    const device = await db.asyncGet(
      'SELECT id FROM trusted_devices WHERE id = ? AND account_id = ?',
      [deviceId, userId]
    );

    if (!device) {
      return res.apiError('设备不存在', 'DEVICE_NOT_FOUND');
    }

    await db.asyncRun('DELETE FROM trusted_devices WHERE id = ? AND account_id = ?', [deviceId, userId]);
    res.apiSuccess(null, '设备已从信任列表移除');
  } catch (error) {
    console.error('移除信任设备错误:', error);
    res.apiError('移除失败', 'TRUSTED_DEVICES_ERROR');
  }
});

// 清空所有信任设备
router.delete('/trusted-devices', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.asyncRun('DELETE FROM trusted_devices WHERE account_id = ?', [userId]);
    res.apiSuccess(null, '已清除所有信任设备');
  } catch (error) {
    console.error('清除信任设备错误:', error);
    res.apiError('清除失败', 'TRUSTED_DEVICES_ERROR');
  }
});

// ==========================
// 登录日志
// ==========================

// 获取登录日志列表
router.get('/login-logs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const logs = await db.asyncAll(
      `SELECT id, action, ip_address, user_agent, details, created_at
       FROM audit_logs
       WHERE account_id = ? AND (action LIKE '%LOGIN%' OR action LIKE '%AUTH%' OR action LIKE 'UPLOAD_FILES' OR action LIKE 'DOWNLOAD_FILE' OR action LIKE 'CHANGE_PASSWORD' OR action LIKE 'DELETE_FILE' OR action LIKE 'PERMANENT_DELETE_FILE')
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    );

    const total = await db.asyncGet(
      `SELECT COUNT(*) as count FROM audit_logs WHERE account_id = ?`,
      [userId]
    );

    res.apiSuccess({
      logs,
      total: total ? total.count : 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取登录日志错误:', error);
    res.apiError('获取失败', 'LOGIN_LOGS_ERROR');
  }
});

// 清空登录日志
router.delete('/login-logs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.asyncRun('DELETE FROM audit_logs WHERE account_id = ?', [userId]);
    res.apiSuccess(null, '登录日志已清空');
  } catch (error) {
    console.error('清空登录日志错误:', error);
    res.apiError('清空失败', 'LOGIN_LOGS_ERROR');
  }
});

module.exports = router;
