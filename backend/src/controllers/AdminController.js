const { db } = require('../config/database');
const { decrypt } = require('../utils/encryption');

// 获取仪表盘统计
const getDashboardStats = async (req, res) => {
  try {
    // 用户数
    const usersResult = await db.asyncGet(
      'SELECT COUNT(*) as count FROM accounts'
    );

    // 文件数
    const filesResult = await db.asyncGet(
      'SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as totalSize FROM files'
    );

    // 分享数
    const sharesResult = await db.asyncGet(
      'SELECT COUNT(*) as count FROM shares'
    );

    res.apiSuccess({
      users: usersResult.count,
      files: filesResult.count,
      totalStorage: filesResult.totalSize,
      shares: sharesResult.count
    });
  } catch (error) {
    console.error('获取仪表盘统计错误:', error);
    res.apiError('获取统计失败', 'DASHBOARD_ERROR');
  }
};

// 获取所有用户
const getAllUsers = async (req, res) => {
  try {
    const users = await db.asyncAll(
      'SELECT id, username, email, role, status, storage_quota, created_at FROM accounts ORDER BY created_at DESC'
    );

    // 解密邮箱
    const usersWithDecryptedEmail = users.map(user => ({
      ...user,
      email: user.email ? decrypt(user.email) : null
    }));

    res.apiSuccess({ users: usersWithDecryptedEmail });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.apiError('获取用户列表失败', 'GET_USERS_ERROR');
  }
};

// 获取用户详情
const getUserDetails = async (req, res) => {
  try {
    const { accountId } = req.params;

    const user = await db.asyncGet(
      'SELECT id, username, email, role, status, storage_quota, created_at FROM accounts WHERE id = ?',
      [accountId]
    );

    if (!user) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 获取用户文件统计
    const fileStats = await db.asyncGet(
      'SELECT COUNT(*) as fileCount, COALESCE(SUM(size), 0) as usedStorage FROM files WHERE account_id = ?',
      [accountId]
    );

    res.apiSuccess({
      ...user,
      email: user.email ? decrypt(user.email) : null,
      fileCount: fileStats.fileCount,
      usedStorage: fileStats.usedStorage
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.apiError('获取用户详情失败', 'GET_USER_DETAILS_ERROR');
  }
};

// 更新用户角色
const updateUserRole = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.apiError('无效的角色', 'VALIDATION_ERROR');
    }

    const result = await db.asyncRun(
      'UPDATE accounts SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, accountId]
    );

    if (result.changes === 0) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_user_role', req.ip, JSON.stringify({ targetUserId: accountId, newRole: role })]
    );

    res.apiSuccess(null, '用户角色更新成功');
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.apiError('更新用户角色失败', 'UPDATE_USER_ROLE_ERROR');
  }
};

// 更新用户状态
const updateUserStatus = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body;

    if (![0, 1].includes(status)) {
      return res.apiError('无效的状态', 'VALIDATION_ERROR');
    }

    const result = await db.asyncRun(
      'UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, accountId]
    );

    if (result.changes === 0) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_user_status', req.ip, JSON.stringify({ targetUserId: accountId, newStatus: status })]
    );

    res.apiSuccess(null, '用户状态更新成功');
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.apiError('更新用户状态失败', 'UPDATE_USER_STATUS_ERROR');
  }
};

// 更新用户配额
const updateUserQuota = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { quota } = req.body;

    if (!quota || quota <= 0) {
      return res.apiError('无效的配额', 'VALIDATION_ERROR');
    }

    const result = await db.asyncRun(
      'UPDATE accounts SET storage_quota = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quota, accountId]
    );

    if (result.changes === 0) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'update_user_quota', req.ip, JSON.stringify({ targetUserId: accountId, newQuota: quota })]
    );

    res.apiSuccess(null, '用户配额更新成功');
  } catch (error) {
    console.error('更新用户配额错误:', error);
    res.apiError('更新用户配额失败', 'UPDATE_USER_QUOTA_ERROR');
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { accountId } = req.params;

    // 不能删除自己
    if (parseInt(accountId) === req.user.id) {
      return res.apiError('不能删除自己', 'CANNOT_DELETE_SELF');
    }

    const result = await db.asyncRun(
      'DELETE FROM accounts WHERE id = ?',
      [accountId]
    );

    if (result.changes === 0) {
      return res.apiError('用户不存在', 'USER_NOT_FOUND');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [req.user.id, 'delete_user', req.ip, JSON.stringify({ targetUserId: accountId })]
    );

    res.apiSuccess(null, '用户删除成功');
  } catch (error) {
    console.error('删除用户错误:', error);
    res.apiError('删除用户失败', 'DELETE_USER_ERROR');
  }
};

// 获取审计日志
const getAuditLogs = async (req, res) => {
  try {
    const { accountId, action } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (accountId) {
      query += ' AND account_id = ?';
      params.push(accountId);
    }

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const logs = await db.asyncAll(query, params);

    res.apiSuccess({ logs });
  } catch (error) {
    console.error('获取审计日志错误:', error);
    res.apiError('获取审计日志失败', 'GET_AUDIT_LOGS_ERROR');
  }
};

// 获取所有文件
const getAllFiles = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT f.*, a.username 
      FROM files f 
      LEFT JOIN accounts a ON f.account_id = a.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND f.original_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY f.created_at DESC LIMIT 100';

    const files = await db.asyncAll(query, params);

    res.apiSuccess({ files });
  } catch (error) {
    console.error('获取所有文件错误:', error);
    res.apiError('获取所有文件失败', 'GET_ALL_FILES_ERROR');
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  updateUserQuota,
  deleteUser,
  getAuditLogs,
  getAllFiles
};
