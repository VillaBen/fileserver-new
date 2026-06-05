const { db } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');
const { v4: uuidv4 } = require('uuid');

// 创建API Token
const createToken = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { name, permissions, expiresInDays } = req.body;

    if (!name) {
      return res.apiError('Token名称不能为空', 'VALIDATION_ERROR');
    }

    // 生成原始Token（给用户看的）
    const rawToken = `ft_${uuidv4()}_${Date.now()}`;
    
    // 加密Token存储
    const encryptedToken = encrypt(rawToken);

    // 计算过期时间
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    // 存储Token
    const result = await db.asyncRun(
      'INSERT INTO api_tokens (account_id, token, name, permissions, expires_at) VALUES (?, ?, ?, ?, ?)',
      [accountId, encryptedToken, name, JSON.stringify(permissions || []), expiresAt]
    );

    // 获取刚创建的Token记录
    const newToken = await db.asyncGet(
      'SELECT id, name, permissions, created_at, expires_at FROM api_tokens WHERE id = ?',
      [result.lastID]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [accountId, 'create_api_token', req.ip, JSON.stringify({ tokenId: result.lastID, name })]
    );

    // 返回原始Token（只返回这一次）
    res.apiSuccess({
      id: newToken.id,
      name: newToken.name,
      token: rawToken,
      permissions: JSON.parse(newToken.permissions || '[]'),
      expiresAt: newToken.expires_at,
      createdAt: newToken.created_at
    }, 'API Token创建成功');
  } catch (error) {
    console.error('创建API Token错误:', error);
    res.apiError('创建API Token失败', 'CREATE_TOKEN_ERROR');
  }
};

// 获取用户的所有API Token
const getTokens = async (req, res) => {
  try {
    const accountId = req.user.id;

    const tokens = await db.asyncAll(
      'SELECT id, name, permissions, last_used_at, expires_at, created_at FROM api_tokens WHERE account_id = ? ORDER BY created_at DESC',
      [accountId]
    );

    const formattedTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      permissions: JSON.parse(token.permissions || '[]'),
      lastUsedAt: token.last_used_at,
      expiresAt: token.expires_at,
      createdAt: token.created_at
    }));

    res.apiSuccess({ tokens: formattedTokens });
  } catch (error) {
    console.error('获取API Tokens错误:', error);
    res.apiError('获取API Tokens失败', 'GET_TOKENS_ERROR');
  }
};

// 删除API Token
const deleteToken = async (req, res) => {
  try {
    const accountId = req.user.id;
    const { id } = req.params;

    // 获取Token信息用于日志
    const token = await db.asyncGet(
      'SELECT name FROM api_tokens WHERE id = ? AND account_id = ?',
      [id, accountId]
    );

    if (!token) {
      return res.apiError('Token不存在或无权限删除', 'TOKEN_NOT_FOUND');
    }

    // 删除Token
    const result = await db.asyncRun(
      'DELETE FROM api_tokens WHERE id = ? AND account_id = ?',
      [id, accountId]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
      [accountId, 'delete_api_token', req.ip, JSON.stringify({ tokenId: id, name: token.name })]
    );

    res.apiSuccess(null, 'Token已删除');
  } catch (error) {
    console.error('删除API Token错误:', error);
    res.apiError('删除API Token失败', 'DELETE_TOKEN_ERROR');
  }
};

module.exports = {
  createToken,
  getTokens,
  deleteToken
};
