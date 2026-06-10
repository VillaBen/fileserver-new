/**
 * 文件管理路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db } = require('../config/database.adapter');
const { encryptFile, decryptFileToStream, decryptFileToCache, getCachedFilePath, getFileHash } = require('../utils/encryption');
const { validateFile, maxFileSize } = require('../middleware/fileValidator');
const { malwareScan, scanPreview } = require('../middleware/malwareScanner');
const { validateFilename, validateFoldername } = require('../utils/validators');
const { sanitizeLikePattern, cryptoRandomString } = require('../utils/security');
const fileTypesConfig = require('../config/file-types');

const router = express.Router();

// 获取支持的文件类型配置
router.get('/supported-types', (req, res) => {
  try {
    const { allowedExtensions, blockedExtensions, maxFileSize: maxSize } = fileTypesConfig;
    res.apiSuccess({
      allowedExtensions,
      blockedExtensions,
      maxFileSize: maxSize,
      maxFileSizeFormatted: (maxSize / (1024 * 1024)).toFixed(2) + ' MB'
    }, '获取支持的文件类型');
  } catch (error) {
    console.error('获取支持的文件类型错误:', error);
    res.apiError('获取支持的文件类型失败', 'SERVER_ERROR');
  }
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: maxFileSize
  }
});

// 辅助函数：根据mime类型判断文件类型
function getFileType(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'document';
  return 'other';
}

// 辅助函数：检查并修复脏数据
async function checkAndFixOrphanedFiles(userId) {
  // 查找所有folder_id指向不存在文件夹的记录
  const orphanedFiles = await db.asyncAll(`
    SELECT f1.* 
    FROM files f1 
    WHERE f1.account_id = ?
    AND f1.folder_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM files f2 
      WHERE f2.id = f1.folder_id
    )
  `, [userId]);

  if (orphanedFiles.length > 0) {
    console.log(`发现 ${orphanedFiles.length} 条脏数据，正在修复...`);
    for (const file of orphanedFiles) {
      await db.asyncRun(
        'UPDATE files SET folder_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [file.id]
      );
      console.log(`已修复文件/文件夹 ${file.original_name} (id=${file.id})`);
    }
    return true;
  }
  return false;
}

// 预览扫描（不保存文件，仅返回扫描结果）
router.post('/preview-scan', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.apiError('请选择要扫描的文件', 'VALIDATION_ERROR');
    }

    const results = [];
    for (const file of files) {
      // 读取文件内容到缓冲区
      const buffer = fs.readFileSync(file.path);
      // 清理临时文件
      fs.unlinkSync(file.path);
      
      const scanResult = await scanPreview({
        originalname: file.originalname,
        buffer: buffer,
        mimetype: file.mimetype,
        size: file.size
      });
      
      results.push(scanResult);
    }

    res.apiSuccess(results, '扫描完成');
  } catch (error) {
    console.error('预览扫描错误:', error);
    res.apiError('扫描失败', 'SCAN_ERROR');
  }
});

// 获取文件列表
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const { folderId, inTrash = 0 } = req.query;

    // 先检查并修复脏数据
    await checkAndFixOrphanedFiles(user.id);

    let sql;
    let params;

    if (!folderId || folderId === 'null' || folderId === 'undefined') {
      // 获取根目录文件
      sql = 'SELECT * FROM files WHERE account_id = ? AND folder_id IS NULL AND in_trash = ? ORDER BY created_at DESC';
      params = [user.id, inTrash];
    } else {
      // 获取指定目录文件
      sql = 'SELECT * FROM files WHERE account_id = ? AND folder_id = ? AND in_trash = ? ORDER BY created_at DESC';
      params = [user.id, folderId, inTrash];
    }

    const files = await db.asyncAll(sql, params);

    // 分离文件和文件夹
    const fileList = [];
    const folderList = [];
    
    // 如果是回收站，获取用户的自动删除设置
    let trashAutoDeleteDays = null;
    if (inTrash == 1) {
      const profile = await db.asyncGet(
        'SELECT trash_auto_delete_days, trash_auto_delete_enabled FROM user_profiles WHERE account_id = ?',
        [user.id]
      );
      if (profile && profile.trash_auto_delete_enabled === 1) {
        trashAutoDeleteDays = profile.trash_auto_delete_days || 30;
      }
    }
    
    for (const file of files) {
      const isFolder = file.type === 'folder' || file.mime_type === 'application/x-directory';
      
      // 转换字段名为驼峰
      const formattedFile = {
        id: file.id,
        name: file.original_name, // 确保有name字段给前端使用
        originalName: file.original_name,
        filename: file.filename,
        filepath: file.filepath,
        size: file.size,
        mimeType: file.mime_type,
        folderId: file.folder_id,
        inTrash: file.in_trash,
        isEncrypted: file.is_encrypted,
        fileHash: file.file_hash,
        securityStatus: file.security_status,
        scanMode: file.scan_mode,
        scanResult: file.scan_result,
        scanAt: file.scan_at,
        createdAt: file.created_at,
        updated_at: file.updated_at,
        updatedAt: file.updated_at,
        deletedAt: file.deleted_at, // 添加删除时间字段
        type: isFolder ? 'folder' : 'file',
        file_type: getFileType(file.mime_type)
      };

      // 如果是回收站文件，计算过期时间
      if (inTrash == 1 && file.deleted_at && trashAutoDeleteDays) {
        const deletedDate = new Date(file.deleted_at);
        deletedDate.setDate(deletedDate.getDate() + trashAutoDeleteDays);
        formattedFile.expiresAt = deletedDate.toISOString();
        formattedFile.expires_at = deletedDate.toISOString();
      }

      if (isFolder) {
        // 计算文件夹内的项目数量（无论是否在回收站中）
        const itemCount = await db.asyncGet(
          'SELECT COUNT(*) as count FROM files WHERE account_id = ? AND folder_id = ?',
          [user.id, file.id]
        );
        formattedFile.item_count = itemCount.count || 0;
        folderList.push(formattedFile);
      } else {
        fileList.push(formattedFile);
      }
    }

    res.apiSuccess({ files: fileList, folders: folderList });
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.apiError('获取文件列表失败', 'GET_FILES_ERROR');
  }
});

// 获取文件统计信息（必须在 /:id 之前定义）
router.get('/stats', async (req, res) => {
  try {
    const user = req.user;

    // 获取文件数量统计
    const fileStats = await db.asyncGet(
      'SELECT COUNT(*) as fileCount, SUM(size) as totalSize FROM files WHERE account_id = ? AND in_trash = 0 AND mime_type NOT LIKE ?',
      [user.id, 'application/x-directory']
    );

    // 获取文件夹数量统计
    const folderStats = await db.asyncGet(
      'SELECT COUNT(*) as folderCount FROM files WHERE account_id = ? AND in_trash = 0 AND (mime_type LIKE ? OR type = ?)',
      [user.id, 'application/x-directory', 'folder']
    );

    // 获取共享文件数量统计
    const shareStats = await db.asyncGet(
      'SELECT COUNT(*) as sharedCount FROM shares WHERE account_id = ?',
      [user.id]
    );

    const stats = {
      fileCount: fileStats.fileCount || 0,
      folderCount: folderStats.folderCount || 0,
      totalSize: fileStats.totalSize || 0,
      sharedCount: shareStats.sharedCount || 0
    };

    res.apiSuccess(stats);
  } catch (error) {
    console.error('获取文件统计错误:', error);
    res.apiError('获取统计失败', 'GET_STATS_ERROR');
  }
});

// 搜索文件（必须在 /:id 之前定义）
router.post('/search', async (req, res) => {
  try {
    const user = req.user;
    const { query } = req.body;

    if (!query) {
      return res.apiError('搜索关键词不能为空', 'VALIDATION_ERROR');
    }

    console.log('[安全] 搜索关键词已转义:', query);
    const files = await db.asyncAll(
      'SELECT * FROM files WHERE account_id = ? AND in_trash = 0 AND original_name LIKE ? ORDER BY created_at DESC',
      [user.id, `%${sanitizeLikePattern(query)}%`]
    );

    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.original_name,
      originalName: file.original_name,
      filename: file.filename,
      filepath: file.filepath,
      size: file.size,
      mimeType: file.mime_type,
      folderId: file.folder_id,
      createdAt: file.created_at
    }));

    res.apiSuccess({ files: formattedFiles, folders: [] });
  } catch (error) {
    console.error('搜索文件错误:', error);
    res.apiError('搜索失败', 'SEARCH_ERROR');
  }
});

// 获取文件夹列表（必须在 /:id 之前定义）
router.get('/folders', async (req, res) => {
  try {
    const user = req.user;
    const { excludeFolderId } = req.query;

    let sql = 'SELECT * FROM files WHERE account_id = ? AND in_trash = 0 AND (type = ? OR mime_type LIKE ?) ORDER BY created_at DESC';
    let params = [user.id, 'folder', 'application/x-directory'];

    // 如果有排除的文件夹ID，不包含该文件夹及其子文件夹（简化版本）
    if (excludeFolderId) {
      sql += ' AND id != ?';
      params.push(excludeFolderId);
    }

    const folders = await db.asyncAll(sql, params);

    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.original_name,
      folderId: folder.folder_id,
      createdAt: folder.created_at
    }));

    res.apiSuccess({ folders: formattedFolders });
  } catch (error) {
    console.error('获取文件夹列表错误:', error);
    res.apiError('获取失败', 'GET_FOLDERS_ERROR');
  }
});

// 上传文件
router.post('/upload', upload.array('files', 10), validateFile, malwareScan, async (req, res) => {
  try {
    const user = req.user;
    const { folderId, conflictAction = 'keepBoth' } = req.body;
    const uploadedFiles = [];
    const conflicts = [];

    // 如果没有文件被 multer 解析，返回明确错误
    if (!req.files || req.files.length === 0) {
      return res.apiError('没有文件被上传，请检查文件类型和格式', 'NO_FILES_UPLOADED');
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      // 确保原始文件名正确处理 UTF-8 编码
      let originalName = file.originalname;
      
      if (originalName && typeof originalName === 'string') {
        try {
          originalName = Buffer.from(originalName, 'latin1').toString('utf8');
        } catch (e) {
          originalName = file.originalname;
        }
      }

      // 验证文件名
      const fileValidation = validateFilename(originalName, false); // 不强制要求扩展名
      if (!fileValidation.valid) {
        conflicts.push({
          fileName: file.originalname,
          reason: fileValidation.errors[0],
          action: 'skipped'
        });
        // 删除临时文件
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        continue;
      }

      // 检查同目录下是否已存在同名文件
      const checkSql = folderId 
        ? 'SELECT id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0'
        : 'SELECT id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0';
      
      const checkParams = folderId ? [user.id, folderId, originalName] : [user.id, originalName];
      const existingFile = await db.asyncGet(checkSql, checkParams);
      
      if (existingFile) {
        if (conflictAction === 'replace') {
          // 覆盖模式：删除现有文件，然后上传新文件
          await db.asyncRun('DELETE FROM files WHERE id = ?', [existingFile.id]);
        } else if (conflictAction === 'keepBoth') {
          // 保留两个：自动重命名新文件
          originalName = await generateUniqueName(user.id, folderId, originalName);
        } else if (conflictAction === 'skip' || conflictAction === 'error') {
          // 跳过模式：跳过该文件并记录冲突
          conflicts.push({
            fileName: file.originalname,
            reason: '文件已存在',
            action: 'skipped'
          });
          continue;
        }
      }

      // 计算文件哈希
      const fileHash = await getFileHash(file.path);
      
      // 加密文件
      const encryptedPath = file.path + '.enc';
      await encryptFile(file.path, encryptedPath);
      
      // 删除原始文件
      fs.unlinkSync(file.path);

      // 获取安全扫描结果
      const scanResult = req.fileScanResults ? req.fileScanResults[i] : null;
      const securityStatus = scanResult ? scanResult.securityStatus : 'unknown';
      const scanMode = scanResult ? scanResult.scanMode : null;
      const scanResultDetails = scanResult ? JSON.stringify({
        warnings: scanResult.warnings,
        details: scanResult.details,
        error: scanResult.error,
        dangerous: scanResult.dangerous,
        warning: scanResult.warning,
        clean: scanResult.clean,
        infected: scanResult.infected,
        securityStatus: scanResult.securityStatus
      }) : null;
      const scanAt = new Date();

      const result = await db.asyncRun(
        'INSERT INTO files (account_id, original_name, filename, filepath, size, mime_type, folder_id, is_encrypted, file_hash, security_status, scan_mode, scan_result, scan_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, originalName, file.filename + '.enc', encryptedPath, file.size, file.mimetype, folderId || null, 1, fileHash, securityStatus, scanMode, scanResultDetails, scanAt]
      );

      uploadedFiles.push({
        id: result.lastID,
        originalName: originalName,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimetype,
        isEncrypted: true,
        fileHash: fileHash,
        securityStatus: securityStatus
      });
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'UPLOAD_FILES', req.ip]
    );

    res.apiSuccess({ 
      uploadedFiles,
      conflicts 
    }, conflicts.length > 0 ? '部分文件上传成功' : '文件上传成功并已加密');
  } catch (error) {
    console.error('上传文件错误:', error);
    res.apiError('文件上传失败', 'UPLOAD_ERROR');
  }
});

// 检查文件冲突
router.post('/check-conflict', async (req, res) => {
  try {
    const user = req.user;
    const { fileName, folderId, action } = req.body;

    if (!fileName) {
      return res.apiError('文件名不能为空', 'VALIDATION_ERROR');
    }

    const checkSql = folderId && folderId !== 'null' && folderId !== 'undefined'
      ? 'SELECT id, original_name, size, created_at, updated_at, type, mime_type, in_trash, folder_id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0'
      : 'SELECT id, original_name, size, created_at, updated_at, type, mime_type, in_trash, folder_id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0';
    
    const checkParams = folderId && folderId !== 'null' && folderId !== 'undefined'
      ? [user.id, folderId, fileName]
      : [user.id, fileName];

    const existingFile = await db.asyncGet(checkSql, checkParams);

    // 判断是否为文件夹
    const isFolder = existingFile && (existingFile.type === 'folder' || existingFile.mime_type === 'application/x-directory');

    res.apiSuccess({
      hasConflict: !!existingFile,
      existingFile: existingFile ? {
        id: existingFile.id,
        name: existingFile.original_name,
        size: existingFile.size,
        type: isFolder ? 'folder' : 'file',
        isFolder: isFolder,
        createdAt: existingFile.created_at,
        updatedAt: existingFile.updated_at
      } : null,
      action: action
    });
  } catch (error) {
    console.error('检查冲突错误:', error);
    res.apiError('检查冲突失败', 'CHECK_CONFLICT_ERROR');
  }
});

// 生成不冲突的文件名
async function generateUniqueName(accountId, folderId, originalName) {
  // 先提取基础名称，去掉已有的副本编号
  let baseName = originalName;
  let baseNameWithoutExt = originalName;
  let ext = '';
  
  const lastDotIndex = originalName.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    baseNameWithoutExt = originalName.substring(0, lastDotIndex);
    ext = originalName.substring(lastDotIndex);
  }
  
  // 检查是否有 _副本(n) 的格式并提取基础名称
  const copyRegex = /_副本\((\d+)\)$/;
  const match = baseNameWithoutExt.match(copyRegex);
  if (match) {
    baseNameWithoutExt = baseNameWithoutExt.substring(0, baseNameWithoutExt.length - match[0].length);
    baseName = baseNameWithoutExt + ext;
  }
  // 检查是否有 _副本 的格式
  else if (baseNameWithoutExt.endsWith('_副本')) {
    baseNameWithoutExt = baseNameWithoutExt.substring(0, baseNameWithoutExt.length - 3);
    baseName = baseNameWithoutExt + ext;
  }
  
  let counter = 1;
  
  while (true) {
    let newName;
    if (counter === 1) {
      if (ext === '') {
        newName = `${baseName}_副本`;
      } else {
        newName = `${baseNameWithoutExt}_副本${ext}`;
      }
    } else {
      if (ext === '') {
        newName = `${baseName}_副本(${counter})`;
      } else {
        newName = `${baseNameWithoutExt}_副本(${counter})${ext}`;
      }
    }
    
    const checkSql = folderId && folderId !== 'null' && folderId !== 'undefined'
      ? 'SELECT id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0'
      : 'SELECT id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0';
    
    const checkParams = folderId && folderId !== 'null' && folderId !== 'undefined'
      ? [accountId, folderId, newName]
      : [accountId, newName];
    
    const existing = await db.asyncGet(checkSql, checkParams);
    
    if (!existing) {
      return newName;
    }
    
    counter++;
  }
}

// 移动文件（必须在 /:id 之前定义）
router.post('/move', async (req, res) => {
  try {
    const user = req.user;
    const { fileIds, targetFolderId, conflictAction = 'replace' } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.apiError('请选择要移动的文件', 'VALIDATION_ERROR');
    }

    // 先收集需要移动的文件信息
    const filesToMove = await db.asyncAll(
      `SELECT id, original_name, type FROM files WHERE account_id = ? AND id IN (${fileIds.map(() => '?').join(',')})`,
      [user.id, ...fileIds]
    );

    let skippedCount = 0;
    let movedCount = 0;

    for (const file of filesToMove) {
      // 检查目标位置是否有同名文件
      const checkSql = targetFolderId && targetFolderId !== 'null' && targetFolderId !== 'undefined'
        ? 'SELECT id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0 AND id != ?'
        : 'SELECT id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0 AND id != ?';
      
      const checkParams = targetFolderId && targetFolderId !== 'null' && targetFolderId !== 'undefined'
        ? [user.id, targetFolderId, file.original_name, file.id]
        : [user.id, file.original_name, file.id];
      
      const existingFile = await db.asyncGet(checkSql, checkParams);

      if (existingFile) {
        // 有冲突
        if (conflictAction === 'replace') {
          // 替换：删除已存在的文件/文件夹
          if (file.type === 'folder') {
            await permanentlyDeleteFolderRecursively(existingFile.id);
          } else {
            if (fs.existsSync(existingFile.filepath)) {
              fs.unlinkSync(existingFile.filepath);
            }
            await db.asyncRun('DELETE FROM files WHERE id = ?', [existingFile.id]);
          }
          // 移动文件
          await db.asyncRun(
            'UPDATE files SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
            [targetFolderId || null, file.id, user.id]
          );
          movedCount++;
        } else if (conflictAction === 'keepBoth') {
          // 保留两个：重命名后移动
          const newName = await generateUniqueName(user.id, targetFolderId, file.original_name);
          await db.asyncRun(
            'UPDATE files SET folder_id = ?, original_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
            [targetFolderId || null, newName, file.id, user.id]
          );
          movedCount++;
        } else if (conflictAction === 'skip') {
          // 跳过
          skippedCount++;
        } else {
          // 默认替换
          if (file.type === 'folder') {
            await permanentlyDeleteFolderRecursively(existingFile.id);
          } else {
            if (fs.existsSync(existingFile.filepath)) {
              fs.unlinkSync(existingFile.filepath);
            }
            await db.asyncRun('DELETE FROM files WHERE id = ?', [existingFile.id]);
          }
          await db.asyncRun(
            'UPDATE files SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
            [targetFolderId || null, file.id, user.id]
          );
          movedCount++;
        }
      } else {
        // 没有冲突，直接移动
        await db.asyncRun(
          'UPDATE files SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
          [targetFolderId || null, file.id, user.id]
        );
        movedCount++;
      }
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'MOVE_FILES', req.ip]
    );

    const message = skippedCount > 0 
      ? `文件移动成功 (${movedCount}个已移动, ${skippedCount}个已跳过)`
      : '文件移动成功';

    res.apiSuccess({ movedCount, skippedCount }, message);
  } catch (error) {
    console.error('移动文件错误:', error);
    res.apiError('移动失败', 'MOVE_ERROR');
  }
});

// 清空回收站（必须在 /:id 之前定义）
router.post('/empty-trash', async (req, res) => {
  try {
    const user = req.user;

    // 获取所有回收站文件
    const files = await db.asyncAll(
      'SELECT * FROM files WHERE account_id = ? AND in_trash = 1',
      [user.id]
    );

    // 删除文件
    for (const file of files) {
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
    }

    // 清空数据库
    await db.asyncRun(
      'DELETE FROM files WHERE account_id = ? AND in_trash = 1',
      [user.id]
    );

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'EMPTY_TRASH', req.ip]
    );

    res.apiSuccess(null, '回收站已清空');
  } catch (error) {
    console.error('清空回收站错误:', error);
    res.apiError('清空失败', 'EMPTY_TRASH_ERROR');
  }
});

// 创建文件夹（必须在 /:id 之前定义）
router.post('/folders', async (req, res) => {
  try {
    const user = req.user;
    const { name, parentId, conflictAction = 'merge' } = req.body;

    if (!name) {
      return res.apiError('文件夹名称不能为空', 'VALIDATION_ERROR');
    }

    // 验证文件夹名称
    const folderValidation = validateFoldername(name);
    if (!folderValidation.valid) {
      return res.apiError(folderValidation.errors[0], 'VALIDATION_ERROR');
    }

    // 检查主目录中是否已存在同名文件夹（只检查主目录，不检查回收站）
    const checkSql = parentId 
      ? 'SELECT id, original_name, in_trash, folder_id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0'
      : 'SELECT id, original_name, in_trash, folder_id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0';
    
    const checkParams = parentId ? [user.id, parentId, name] : [user.id, name];
    const existingFile = await db.asyncGet(checkSql, checkParams);
    
    if (existingFile) {
      // 如果已存在同名文件夹
      if (conflictAction === 'merge') {
        // 合并模式：将新文件夹的内容移动到已存在的文件夹中
        // 注意：这里假设前端已经将新文件夹的内容作为参数传递
        // 如果没有传递内容，则只返回已存在的文件夹ID
        res.apiSuccess({ 
          id: existingFile.id, 
          name, 
          parentId, 
          existing: true, 
          conflict: true,
          merged: true 
        }, '文件夹已存在，内容已合并');
        return;
      } else if (conflictAction === 'keepBoth') {
        // 保留两个：重命名新文件夹
        const newName = await generateUniqueName(user.id, parentId, name);
        // 为文件夹生成唯一的filename（使用时间戳和随机数）
        const folderFilename = `folder_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        // 创建新文件夹
        const result = await db.asyncRun(
          'INSERT INTO files (account_id, original_name, filename, filepath, size, mime_type, folder_id, type, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            user.id,
            newName,
            folderFilename,
            '',
            0,
            'application/x-directory',
            parentId || null,
            'folder',
            0
          ]
        );
        await db.asyncRun(
          'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
          [user.id, 'CREATE_FOLDER', req.ip]
        );
        res.apiSuccess({ id: result.lastID, name: newName, parentId }, '文件夹创建成功（已重命名）');
        return;
      } else if (conflictAction === 'replace') {
        // 替换模式：删除已存在的文件夹，创建新的
        await db.asyncRun('DELETE FROM files WHERE id = ?', [existingFile.id]);
      } else if (conflictAction === 'skip') {
        // 跳过模式：不创建
        res.apiSuccess({ skipped: true }, '文件夹创建已跳过');
        return;
      } else {
        // 默认报错
        return res.apiError('该文件夹已存在', 'FOLDER_EXISTS');
      }
    }

    // 创建文件夹记录
    // 为文件夹生成唯一的filename（使用时间戳和随机数，避免与回收站中的文件夹冲突）
    const folderFilename = `folder_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const result = await db.asyncRun(
      'INSERT INTO files (account_id, original_name, filename, filepath, size, mime_type, folder_id, type, is_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.id,
        name,
        folderFilename,
        '',
        0,
        'application/x-directory',
        parentId || null,
        'folder',
        0
      ]
    );

    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'CREATE_FOLDER', req.ip]
    );

    res.apiSuccess({ id: result.lastID, name, parentId }, '文件夹创建成功');
  } catch (error) {
    console.error('创建文件夹错误:', error);
    res.apiError('创建文件夹失败', 'CREATE_FOLDER_ERROR');
  }
});

// ============ 动态路由 - 必须放在所有特定路由之后 ============

// 获取文件扫描详情
router.get('/:id/scan-result', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const file = await db.asyncGet(
      'SELECT id, original_name, security_status, scan_mode, scan_result, scan_at FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    let parsedResult = null;
    try {
      parsedResult = file.scan_result ? JSON.parse(file.scan_result) : null;
    } catch (e) {
      parsedResult = { raw: file.scan_result };
    }

    res.apiSuccess({
      id: file.id,
      fileName: file.original_name,
      securityStatus: file.security_status,
      scanMode: file.scan_mode,
      warnings: parsedResult?.warnings || [],
      details: parsedResult?.details || null,
      error: parsedResult?.error || null,
      scanAt: file.scan_at
    }, '获取扫描详情成功');
  } catch (error) {
    console.error('获取扫描详情错误:', error);
    res.apiError('获取扫描详情失败', 'GET_SCAN_RESULT_ERROR');
  }
});

// 获取单个文件
router.get('/:id', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    const formattedFile = {
      id: file.id,
      name: file.original_name,
      originalName: file.original_name,
      filename: file.filename,
      filepath: file.filepath,
      size: file.size,
      mimeType: file.mime_type,
      folderId: file.folder_id,
      inTrash: file.in_trash,
      isEncrypted: file.is_encrypted,
      fileHash: file.file_hash,
      createdAt: file.created_at,
      updatedAt: file.updated_at
    };

    res.apiSuccess(formattedFile);
  } catch (error) {
    console.error('获取文件错误:', error);
    res.apiError('获取文件失败', 'GET_FILE_ERROR');
  }
});

// 下载文件
router.get('/:id/download', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 检查文件是否存在
    if (!fs.existsSync(file.filepath)) {
      return res.apiError('文件已丢失', 'FILE_MISSING');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'DOWNLOAD_FILE', req.ip]
    );

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);

    if (file.is_encrypted) {
      // 解密文件并流式传输
      const stream = await decryptFileToStream(file.filepath);
      stream.pipe(res);
    } else {
      // 直接传输
      fs.createReadStream(file.filepath).pipe(res);
    }
  } catch (error) {
    console.error('下载文件错误:', error);
    res.apiError('下载失败', 'DOWNLOAD_ERROR');
  }
});

// 递归删除文件夹及其内容
async function deleteFolderRecursively(folderId, userId) {
  // 先删除所有子文件和子文件夹
  const children = await db.asyncAll(
    'SELECT id, type FROM files WHERE folder_id = ? AND account_id = ? AND in_trash = 0',
    [folderId, userId]
  );

  for (const child of children) {
    if (child.type === 'folder') {
      // 递归删除子文件夹
      await deleteFolderRecursively(child.id, userId);
    } else {
      // 删除子文件
      await db.asyncRun(
        'UPDATE files SET in_trash = 1, updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
        [child.id]
      );
    }
  }

  // 最后删除当前文件夹
  await db.asyncRun(
    'UPDATE files SET in_trash = 1, updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
    [folderId]
  );
}

// 删除文件（移到回收站）
router.delete('/:id', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 获取要删除的文件/文件夹信息
    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 如果是文件夹，递归删除所有内容
    if (file.type === 'folder') {
      await deleteFolderRecursively(id, user.id);
    } else {
      // 删除单个文件
      await db.asyncRun(
        'UPDATE files SET in_trash = 1, updated_at = CURRENT_TIMESTAMP, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
        [id, user.id]
      );
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'DELETE_FILE', req.ip]
    );

    res.apiSuccess(null, file.type === 'folder' ? '文件夹及其内容已移到回收站' : '文件已移到回收站');
  } catch (error) {
    console.error('删除文件错误:', error);
    res.apiError('删除失败', 'DELETE_ERROR');
  }
});

// 递归恢复文件夹及其内容
async function restoreFolderRecursively(folderId, userId) {
  // 先恢复当前文件夹
  await db.asyncRun(
    'UPDATE files SET in_trash = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [folderId]
  );

  // 查找所有子文件和子文件夹（包括已删除的）
  const children = await db.asyncAll(
    'SELECT id, type FROM files WHERE folder_id = ? AND account_id = ? AND in_trash = 1',
    [folderId, userId]
  );

  for (const child of children) {
    if (child.type === 'folder') {
      // 递归恢复子文件夹
      await restoreFolderRecursively(child.id, userId);
    } else {
      // 恢复子文件
      await db.asyncRun(
        'UPDATE files SET in_trash = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [child.id]
      );
    }
  }
}

// 恢复文件
// 合并文件夹：将源文件夹的内容合并到目标文件夹
async function mergeFolderContents(sourceFolderId, targetFolderId, userId) {
  // 获取源文件夹的直接子项
  const children = await db.asyncAll(
    'SELECT id, type FROM files WHERE folder_id = ? AND account_id = ? AND in_trash = 1',
    [sourceFolderId, userId]
  );
  
  // 先递归处理所有子文件夹的内容
  for (const child of children) {
    if (child.type === 'folder') {
      // 对于子文件夹，先递归合并其内容到目标文件夹
      await mergeFolderContents(child.id, targetFolderId, userId);
    }
  }
  
  // 重新获取子项（递归处理后，可能有些已经被移动了）
  const remainingChildren = await db.asyncAll(
    'SELECT id, type FROM files WHERE folder_id = ? AND account_id = ? AND in_trash = 1',
    [sourceFolderId, userId]
  );
  
  // 将剩余的子项（文件和已处理完的文件夹）移动到目标文件夹
  for (const child of remainingChildren) {
    await db.asyncRun(
      'UPDATE files SET folder_id = ?, in_trash = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [targetFolderId, child.id]
    );
  }
  
  // 删除源文件夹（内容已经被合并到目标文件夹）
  await db.asyncRun('DELETE FROM files WHERE id = ?', [sourceFolderId]);
}

// 恢复文件
router.post('/:id/restore', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { conflictAction = 'keepBoth' } = req.body;

    // 获取要恢复的文件/文件夹信息
    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ? AND in_trash = 1',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 检查目标位置是否已有同名文件/文件夹（只检查主目录）
    const checkSql = file.folder_id 
      ? 'SELECT id FROM files WHERE account_id = ? AND folder_id = ? AND original_name = ? AND in_trash = 0'
      : 'SELECT id FROM files WHERE account_id = ? AND folder_id IS NULL AND original_name = ? AND in_trash = 0';
    
    const checkParams = file.folder_id ? [user.id, file.folder_id, file.original_name] : [user.id, file.original_name];
    const existingFile = await db.asyncGet(checkSql, checkParams);
    
    if (existingFile) {
      if (conflictAction === 'replace') {
        // 覆盖模式：删除现有文件
        await db.asyncRun('DELETE FROM files WHERE id = ?', [existingFile.id]);
      } else if (conflictAction === 'keepBoth') {
        // 保留两个：重命名要恢复的文件/文件夹
        const newName = await generateUniqueName(user.id, file.folder_id, file.original_name);
        await db.asyncRun(
          'UPDATE files SET original_name = ? WHERE id = ?',
          [newName, id]
        );
      } else if (conflictAction === 'merge') {
        // 合并模式：如果是文件夹，将内容合并到已存在的文件夹中，然后删除要恢复的文件夹
        if (file.type === 'folder') {
          await mergeFolderContents(id, existingFile.id, user.id);
          return res.apiSuccess({ merged: true }, '文件夹内容已合并到已存在的文件夹');
        } else {
          // 非文件夹：重命名后恢复
          const newName = await generateUniqueName(user.id, file.folder_id, file.original_name);
          await db.asyncRun(
            'UPDATE files SET original_name = ?, in_trash = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newName, id]
          );
          return res.apiSuccess(null, '文件已恢复（已重命名）');
        }
      } else {
        // 默认报错
        return res.apiError('目标位置已有同名文件或文件夹，无法恢复', 'FILE_EXISTS_IN_TARGET');
      }
    }

    // 如果是文件夹，递归恢复所有内容
    if (file.type === 'folder') {
      await restoreFolderRecursively(id, user.id);
    } else {
      // 恢复单个文件
      await db.asyncRun(
        'UPDATE files SET in_trash = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
        [id, user.id]
      );
    }

    res.apiSuccess(null, file.type === 'folder' ? '文件夹及其内容已恢复' : '文件已恢复');
  } catch (error) {
    console.error('恢复文件错误:', error);
    res.apiError('恢复失败', 'RESTORE_ERROR');
  }
});

// 递归永久删除文件夹及其内容
async function permanentlyDeleteFolderRecursively(folderId) {
  // 先删除所有子文件和子文件夹
  const children = await db.asyncAll(
    'SELECT id, type, filepath FROM files WHERE folder_id = ?',
    [folderId]
  );

  for (const child of children) {
    if (child.type === 'folder') {
      // 递归永久删除子文件夹
      await permanentlyDeleteFolderRecursively(child.id);
    } else {
      // 删除子文件
      if (fs.existsSync(child.filepath)) {
        fs.unlinkSync(child.filepath);
      }
      await db.asyncRun('DELETE FROM files WHERE id = ?', [child.id]);
    }
  }

  // 获取当前文件夹信息并删除
  const folder = await db.asyncGet('SELECT * FROM files WHERE id = ?', [folderId]);
  if (folder && folder.filepath && fs.existsSync(folder.filepath)) {
    fs.unlinkSync(folder.filepath);
  }
  await db.asyncRun('DELETE FROM files WHERE id = ?', [folderId]);
}

// 永久删除文件
router.delete('/:id/permanently', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 获取文件信息
    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    if (file.type === 'folder') {
      // 递归永久删除文件夹及其内容
      await permanentlyDeleteFolderRecursively(id);
    } else {
      // 删除单个文件
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      await db.asyncRun('DELETE FROM files WHERE id = ?', [id]);
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'PERMANENT_DELETE_FILE', req.ip]
    );

    res.apiSuccess(null, file.type === 'folder' ? '文件夹及其内容已永久删除' : '文件已永久删除');
  } catch (error) {
    console.error('永久删除文件错误:', error);
    res.apiError('删除失败', 'PERMANENT_DELETE_ERROR');
  }
});

// 重命名文件
router.put('/:id/rename', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.apiError('新文件名不能为空', 'VALIDATION_ERROR');
    }

    // 先获取文件信息，判断是文件还是文件夹
    const fileInfo = await db.asyncGet(
      'SELECT type, mime_type FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!fileInfo) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 根据类型使用相应的验证
    const isFolder = fileInfo.type === 'folder' || fileInfo.mime_type === 'application/x-directory';
    if (isFolder) {
      const folderValidation = validateFoldername(newName);
      if (!folderValidation.valid) {
        return res.apiError(folderValidation.errors[0], 'VALIDATION_ERROR');
      }
    } else {
      const fileValidation = validateFilename(newName, false); // 不强制要求扩展名
      if (!fileValidation.valid) {
        return res.apiError(fileValidation.errors[0], 'VALIDATION_ERROR');
      }
    }

    const result = await db.asyncRun(
      'UPDATE files SET original_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?',
      [newName, id, user.id]
    );

    if (result.changes === 0) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    res.apiSuccess(null, '文件重命名成功');
  } catch (error) {
    console.error('重命名文件错误:', error);
    res.apiError('重命名失败', 'RENAME_ERROR');
  }
});

// 流式播放（带缓存 + HTTP Range 支持）
// 首次请求：解密到缓存目录；后续请求（含 Range）直接从缓存文件流式传输
// 支持通过 header 或 query 参数 token 进行认证（便于 <audio>、<video> 标签直接使用 URL）
router.get('/:id/stream', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    if (!fs.existsSync(file.filepath)) {
      return res.apiError('文件已丢失', 'FILE_MISSING');
    }

    const CACHE_DIR = path.join(__dirname, '../../cache/decrypted');
    const cacheKey = String(file.id);
    let cachedPath = getCachedFilePath(CACHE_DIR, cacheKey, file.size);

    // 若加密文件且缓存未命中，先解密到缓存
    if (file.is_encrypted && !cachedPath) {
      try {
        cachedPath = await decryptFileToCache(file.filepath, CACHE_DIR, cacheKey);
      } catch (decryptErr) {
        console.error('解密到缓存失败:', decryptErr);
        return res.apiError('解密失败', 'DECRYPT_ERROR');
      }
    } else if (!file.is_encrypted) {
      cachedPath = file.filepath;
    }

    if (!cachedPath || !fs.existsSync(cachedPath)) {
      return res.apiError('资源不可用', 'FILE_UNAVAILABLE');
    }

    const stat = fs.statSync(cachedPath);
    const total = stat.size;
    const mimeType = file.mime_type || 'application/octet-stream';

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);

    const rangeHeader = req.headers.range;

    // 处理 Range 请求
    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
      if (!rangeMatch) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.end();
      }

      let start = rangeMatch[1] === '' ? null : parseInt(rangeMatch[1], 10);
      let end = rangeMatch[2] === '' ? null : parseInt(rangeMatch[2], 10);

      // 未指定 end 则读到文件末尾
      if (start === null && end !== null) {
        // suffix range: bytes=-N => last N bytes
        start = Math.max(0, total - end);
        end = total - 1;
      } else if (start !== null && end === null) {
        end = total - 1;
      } else if (start === null && end === null) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.end();
      }

      if (isNaN(start) || isNaN(end) || start > end || start >= total) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.end();
      }

      end = Math.min(end, total - 1);

      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', end - start + 1);

      const stream = fs.createReadStream(cachedPath, { start, end });
      stream.on('error', (err) => {
        console.error('Range 流传输错误:', err);
        if (!res.headersSent) res.status(500).end();
      });
      stream.pipe(res);
      return;
    }

    // 无 Range：整文件传输
    res.statusCode = 200;
    res.setHeader('Content-Length', total);
    const stream = fs.createReadStream(cachedPath);
    stream.on('error', (err) => {
      console.error('流传输错误:', err);
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    console.error('stream 接口错误:', error);
    if (!res.headersSent) {
      res.apiError('播放失败', 'STREAM_ERROR');
    }
  }
});

// 预览文件
router.get('/:id/preview', async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const file = await db.asyncGet(
      'SELECT * FROM files WHERE id = ? AND account_id = ?',
      [id, user.id]
    );

    if (!file) {
      return res.apiError('文件不存在', 'FILE_NOT_FOUND');
    }

    // 检查文件是否存在
    if (!fs.existsSync(file.filepath)) {
      return res.apiError('文件已丢失', 'FILE_MISSING');
    }

    // 记录审计日志
    await db.asyncRun(
      'INSERT INTO audit_logs (account_id, action, ip_address) VALUES (?, ?, ?)',
      [user.id, 'PREVIEW_FILE', req.ip]
    );

    // 设置响应头为内联预览
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);

    if (file.is_encrypted) {
      // 解密文件并流式传输
      const stream = await decryptFileToStream(file.filepath);
      stream.pipe(res);
    } else {
      // 直接传输
      fs.createReadStream(file.filepath).pipe(res);
    }
  } catch (error) {
    console.error('预览文件错误:', error);
    res.apiError('预览失败', 'PREVIEW_ERROR');
  }
});

module.exports = router;
