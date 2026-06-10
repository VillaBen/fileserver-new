/**
 * 播放列表路由
 * - 创建/删除/重命名播放列表
 * - 添加/移除播放列表项（音乐文件）
 */

const express = require('express');
const { db } = require('../config/database.adapter');

const router = express.Router();

// ==========================
// 播放列表管理
// ==========================

// 获取所有播放列表
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlists = await db.asyncAll(
      'SELECT id, name, description, cover_image, item_count, created_at, updated_at FROM playlists WHERE account_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    // 获取每个播放列表的第一项作为封面（如果没有指定封面）
    for (const pl of playlists) {
      if (!pl.cover_image) {
        const firstItem = await db.asyncGet(
          `SELECT f.original_name, f.mime_type
           FROM playlist_items pi
           INNER JOIN files f ON pi.file_id = f.id
           WHERE pi.playlist_id = ?
           ORDER BY pi.order_index ASC
           LIMIT 1`,
          [pl.id]
        );
        pl.firstItemName = firstItem ? firstItem.original_name : null;
      }
    }

    res.apiSuccess(playlists);
  } catch (error) {
    console.error('获取播放列表错误:', error);
    res.apiError('获取失败', 'PLAYLISTS_ERROR');
  }
});

// 获取播放列表详情及其项目
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;

    const playlist = await db.asyncGet(
      'SELECT id, name, description, cover_image, item_count, created_at, updated_at FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    const items = await db.asyncAll(
      `SELECT pi.id, pi.file_id, pi.order_index, pi.added_at,
              f.original_name, f.filename, f.filepath, f.mime_type, f.size, f.is_encrypted
       FROM playlist_items pi
       INNER JOIN files f ON pi.file_id = f.id
       WHERE pi.playlist_id = ? AND pi.account_id = ?
       ORDER BY pi.order_index ASC, pi.added_at ASC`,
      [playlistId, userId]
    );

    playlist.items = items;
    res.apiSuccess(playlist);
  } catch (error) {
    console.error('获取播放列表详情错误:', error);
    res.apiError('获取失败', 'PLAYLISTS_ERROR');
  }
});

// 创建播放列表
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.apiError('播放列表名称不能为空', 'VALIDATION_ERROR');
    }

    const result = await db.asyncRun(
      'INSERT INTO playlists (account_id, name, description) VALUES (?, ?, ?)',
      [userId, name.trim(), description || '']
    );

    res.apiSuccess({ id: result.lastID, name: name.trim() }, '播放列表已创建');
  } catch (error) {
    console.error('创建播放列表错误:', error);
    res.apiError('创建失败', 'PLAYLISTS_ERROR');
  }
});

// 重命名播放列表
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const { name, description } = req.body;

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    if (name && name.trim() !== '') {
      await db.asyncRun(
        'UPDATE playlists SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name.trim(), description !== undefined ? description : '', playlistId]
      );
    }

    res.apiSuccess(null, '播放列表已更新');
  } catch (error) {
    console.error('更新播放列表错误:', error);
    res.apiError('更新失败', 'PLAYLISTS_ERROR');
  }
});

// 删除播放列表
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    await db.asyncRun('DELETE FROM playlist_items WHERE playlist_id = ? AND account_id = ?', [playlistId, userId]);
    await db.asyncRun('DELETE FROM playlists WHERE id = ? AND account_id = ?', [playlistId, userId]);

    res.apiSuccess(null, '播放列表已删除');
  } catch (error) {
    console.error('删除播放列表错误:', error);
    res.apiError('删除失败', 'PLAYLISTS_ERROR');
  }
});

// ==========================
// 播放列表项管理
// ==========================

// 添加文件到播放列表
router.post('/:id/items', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const { fileId } = req.body;

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    if (!fileId) {
      return res.apiError('文件 ID 不能为空', 'VALIDATION_ERROR');
    }

    // 验证文件属于当前用户
    const file = await db.asyncGet(
      'SELECT id, original_name, mime_type FROM files WHERE id = ? AND account_id = ?',
      [fileId, userId]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 检查是否已存在
    const existingItem = await db.asyncGet(
      'SELECT id FROM playlist_items WHERE playlist_id = ? AND file_id = ? AND account_id = ?',
      [playlistId, fileId, userId]
    );

    if (existingItem) {
      return res.apiError('该文件已在播放列表中', 'ITEM_ALREADY_EXISTS');
    }

    // 获取当前最大 order_index
    const maxOrder = await db.asyncGet(
      'SELECT COALESCE(MAX(order_index), -1) as maxOrder FROM playlist_items WHERE playlist_id = ?',
      [playlistId]
    );
    const newOrder = (maxOrder ? maxOrder.maxOrder : -1) + 1;

    await db.asyncRun(
      'INSERT INTO playlist_items (playlist_id, file_id, account_id, order_index) VALUES (?, ?, ?, ?)',
      [playlistId, fileId, userId, newOrder]
    );

    // 更新 item_count
    await db.asyncRun(
      'UPDATE playlists SET item_count = item_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [playlistId]
    );

    res.apiSuccess(null, `已将 ${file.original_name} 添加到播放列表`);
  } catch (error) {
    console.error('添加播放列表项错误:', error);
    res.apiError('添加失败', 'PLAYLISTS_ERROR');
  }
});

// 批量添加文件到播放列表
router.post('/:id/items/batch', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.apiError('文件 ID 列表不能为空', 'VALIDATION_ERROR');
    }

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    let addedCount = 0;
    for (const fileId of fileIds) {
      const file = await db.asyncGet(
        'SELECT id FROM files WHERE id = ? AND account_id = ?',
        [fileId, userId]
      );

      if (!file) continue;

      const existingItem = await db.asyncGet(
        'SELECT id FROM playlist_items WHERE playlist_id = ? AND file_id = ? AND account_id = ?',
        [playlistId, fileId, userId]
      );

      if (existingItem) continue;

      const maxOrder = await db.asyncGet(
        'SELECT COALESCE(MAX(order_index), -1) as maxOrder FROM playlist_items WHERE playlist_id = ?',
        [playlistId]
      );
      const newOrder = (maxOrder ? maxOrder.maxOrder : -1) + 1;

      await db.asyncRun(
        'INSERT INTO playlist_items (playlist_id, file_id, account_id, order_index) VALUES (?, ?, ?, ?)',
        [playlistId, fileId, userId, newOrder]
      );
      addedCount++;
    }

    if (addedCount > 0) {
      await db.asyncRun(
        'UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [playlistId]
      );
    }

    res.apiSuccess({ addedCount }, `已添加 ${addedCount} 个文件到播放列表`);
  } catch (error) {
    console.error('批量添加播放列表项错误:', error);
    res.apiError('添加失败', 'PLAYLISTS_ERROR');
  }
});

// 从播放列表移除文件
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const itemId = req.params.itemId;

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    const item = await db.asyncGet(
      'SELECT id FROM playlist_items WHERE id = ? AND playlist_id = ? AND account_id = ?',
      [itemId, playlistId, userId]
    );

    if (!item) {
      return res.apiError('播放列表项不存在', 'ITEM_NOT_FOUND');
    }

    await db.asyncRun('DELETE FROM playlist_items WHERE id = ?', [itemId]);
    await db.asyncRun(
      'UPDATE playlists SET item_count = item_count - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [playlistId]
    );

    res.apiSuccess(null, '已从播放列表移除');
  } catch (error) {
    console.error('移除播放列表项错误:', error);
    res.apiError('移除失败', 'PLAYLISTS_ERROR');
  }
});

// 调整播放列表项顺序
router.post('/:id/items/reorder', async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = req.params.id;
    const { items } = req.body; // [{ id: 1, order_index: 0 }, ...]

    if (!items || !Array.isArray(items)) {
      return res.apiError('项目列表不能为空', 'VALIDATION_ERROR');
    }

    const playlist = await db.asyncGet(
      'SELECT id FROM playlists WHERE id = ? AND account_id = ?',
      [playlistId, userId]
    );

    if (!playlist) {
      return res.apiError('播放列表不存在', 'PLAYLIST_NOT_FOUND');
    }

    for (const item of items) {
      if (item.id && item.order_index !== undefined) {
        await db.asyncRun(
          'UPDATE playlist_items SET order_index = ? WHERE id = ? AND playlist_id = ? AND account_id = ?',
          [item.order_index, item.id, playlistId, userId]
        );
      }
    }

    await db.asyncRun(
      'UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [playlistId]
    );

    res.apiSuccess(null, '顺序已更新');
  } catch (error) {
    console.error('重排播放列表项错误:', error);
    res.apiError('操作失败', 'PLAYLISTS_ERROR');
  }
});

module.exports = router;
