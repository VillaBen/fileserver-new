/**
 * 通知系统路由
 */

const express = require('express');
const { db } = require('../config/database.adapter');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 获取通知列表
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const onlyUnread = req.query.unread === 'true';

    let sql = `
      SELECT id, type, title, message, action_url, \`read\`, read_at, created_at
      FROM notifications
      WHERE account_id = ?
    `;
    const params = [userId];

    if (onlyUnread) {
      sql += ' AND \`read\` = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = await db.asyncAll(sql, params);

    // 获取未读总数
    const unreadResult = await db.asyncGet(
      'SELECT COUNT(*) as count FROM notifications WHERE account_id = ? AND \`read\` = 0',
      [userId]
    );

    const totalResult = await db.asyncGet(
      'SELECT COUNT(*) as count FROM notifications WHERE account_id = ?',
      [userId]
    );

    res.apiSuccess({
      notifications,
      unreadCount: unreadResult ? unreadResult.count : 0,
      totalCount: totalResult ? totalResult.count : 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取通知错误:', error);
    res.apiError('获取失败', 'NOTIFICATIONS_ERROR');
  }
});

// 标记单条通知为已读
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await db.asyncGet(
      'SELECT id FROM notifications WHERE id = ? AND account_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      return res.apiError('通知不存在', 'NOT_FOUND');
    }

    await db.asyncRun(
      'UPDATE notifications SET \`read\` = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?',
      [notificationId]
    );

    res.apiSuccess(null, '已标记为已读');
  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.apiError('操作失败', 'NOTIFICATIONS_ERROR');
  }
});

// 标记单条通知为未读
router.put('/:id/unread', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await db.asyncGet(
      'SELECT id FROM notifications WHERE id = ? AND account_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      return res.apiError('通知不存在', 'NOT_FOUND');
    }

    await db.asyncRun(
      'UPDATE notifications SET \`read\` = 0, read_at = NULL WHERE id = ?',
      [notificationId]
    );

    res.apiSuccess(null, '已标记为未读');
  } catch (error) {
    console.error('标记通知未读错误:', error);
    res.apiError('操作失败', 'NOTIFICATIONS_ERROR');
  }
});

// 全部标记为已读
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.asyncRun(
      'UPDATE notifications SET \`read\` = 1, read_at = CURRENT_TIMESTAMP WHERE account_id = ? AND \`read\` = 0',
      [userId]
    );
    res.apiSuccess(null, '全部标记为已读');
  } catch (error) {
    console.error('全部标记已读错误:', error);
    res.apiError('操作失败', 'NOTIFICATIONS_ERROR');
  }
});

// 删除单条通知
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await db.asyncGet(
      'SELECT id FROM notifications WHERE id = ? AND account_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      return res.apiError('通知不存在', 'NOT_FOUND');
    }

    await db.asyncRun('DELETE FROM notifications WHERE id = ? AND account_id = ?', [notificationId, userId]);
    res.apiSuccess(null, '通知已删除');
  } catch (error) {
    console.error('删除通知错误:', error);
    res.apiError('操作失败', 'NOTIFICATIONS_ERROR');
  }
});

// 清空所有通知
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.asyncRun('DELETE FROM notifications WHERE account_id = ?', [userId]);
    res.apiSuccess(null, '所有通知已清空');
  } catch (error) {
    console.error('清空通知错误:', error);
    res.apiError('操作失败', 'NOTIFICATIONS_ERROR');
  }
});

// 创建通知（仅管理员或系统内部使用）
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, title, message, actionUrl } = req.body;

    if (!title) {
      return res.apiError('通知标题不能为空', 'VALIDATION_ERROR');
    }

    const result = await db.asyncRun(
      'INSERT INTO notifications (account_id, type, title, message, action_url) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        type || 'info',
        title,
        message || '',
        actionUrl || null
      ]
    );

    res.apiSuccess({ id: result.lastID }, '通知已创建');
  } catch (error) {
    console.error('创建通知错误:', error);
    res.apiError('创建失败', 'NOTIFICATIONS_ERROR');
  }
});

module.exports = router;
