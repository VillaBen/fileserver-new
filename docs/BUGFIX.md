# 修复日志

本文件记录项目开发过程中遇到的问题及修复方案。按日期倒序排列，优先显示最新修复。

---

## 2026-06-15

### P1 - 上传暂停/恢复导致副本文件问题（竞态条件）

**问题**：上传文件时多次点击暂停/恢复按钮，产生了重复的副本文件（如 `mvmp4264_..._副本.mp4`）。

**根本原因**：[files.js](file:///workspace/frontend/src/stores/files.js) 中 `startUploads` 函数缺少并发控制机制，当用户快速点击暂停/恢复按钮时，会触发多个 `startUploads` 循环并发执行：

1. 用户点击暂停 → 文件状态变为 `paused`，但 `startUploads` 的 while 循环仍在运行
2. 用户点击恢复 → `resumeUpload` 调用 `startUploads()`，**再次启动一个新的上传循环**
3. 两个循环并发处理队列中的文件，导致同一个文件被重复上传
4. 后端在 `keepBoth` 模式下自动重命名为"副本"

**关键问题代码**：
```javascript
// 修复前 - startUploads 无并发控制，可被重复调用
async function startUploads(folderId = null, conflictAction = 'keepBoth') {
  while (true) {  // ❌ 多个 while 循环可同时运行
    // ...处理文件
  }
}

function resumeUpload(uploadId) {
  // ...
  uploadItem.status = 'pending';
  await startUploads();  // ❌ 再次调用启动新循环
}
```

**修复文件**：
- [files.js](file:///workspace/frontend/src/stores/files.js)

**修复内容**：

1. **新增 `isUploadingLoopActive` 标志**（第 31 行）：
   ```javascript
   const isUploadingLoopActive = ref(false); // 防止 startUploads 并发调用的标志
   ```

2. **修改 `startUploads` 函数**（第 185-228 行）：
   - 入口处检查标志，如已有上传循环在运行则直接返回
   - 使用 `try-finally` 结构确保标志正确重置（即使出错也能释放）
   ```javascript
   async function startUploads(folderId = null, conflictAction = 'keepBoth') {
     if (isUploadingLoopActive.value) return;
     isUploadingLoopActive.value = true;
     try {
       // ...原有循环逻辑
     } finally {
       isUploadingLoopActive.value = false;
     }
   }
   ```

**修复后行为**：

| 操作 | 修复前 | 修复后 |
|------|--------|--------|
| 快速点击暂停/恢复 | 可能启动多个并发上传循环 → 产生副本 | 仅一个循环活动 → 不会重复上传 |
| 多文件暂停后恢复 | 所有文件被多个循环并发处理 | 单循环按顺序逐个处理 |
| `resumeUpload` 调用 | 每次调用都启动新循环 | 如已有循环则复用，无则新启动 |

---

### P2 - 文件上传完成后列表不立即刷新

**问题**：单个文件上传完成后，用户无法立即在文件列表中看到该文件，需要等待所有上传完成才刷新，或者手动刷新页面。

**根本原因**：[files.js](file:///workspace/frontend/src/stores/files.js) 中 `uploadSingleFile` 的 `finally` 块只在"所有文件上传完成"时（`uploadQueue.length === 0 && activeUploads.length === 0`）才调用 `loadFiles` 刷新列表，单个文件成功后缺少即时刷新逻辑。

```javascript
// 修复前 - finally 块中检查全部完成才刷新
finally {
  // 检查是否所有上传都完成
  if (uploadQueue.value.length === 0 && activeUploads.value.length === 0) {
    await loadFiles(currentFolderId.value);  // ❌ 只有全部完成才刷新
  }
}
```

**修复文件**：
- [files.js](file:///workspace/frontend/src/stores/files.js)

**修复内容**（第 287-297 行）：

在上传成功分支（`uploadItem.status = 'completed'` 后）添加即时刷新：
```javascript
// 完全成功
uploadItem.status = 'completed';
uploadItem.progress = 100;
completedUploads.value.push(uploadItem);

// 单个文件上传成功后立即刷新列表，让用户能及时看到已上传的文件
await loadFiles(currentFolderId.value);
```

**修复后行为**：

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 第一个文件上传完成 | 列表不刷新 | 列表立即刷新，文件显示 |
| 后续文件上传完成 | 列表不刷新 | 列表立即刷新，文件显示 |
| 全部文件完成 | 列表刷新（一次） | 列表已在每次完成时刷新 |

---

### P2 - 新增上传/下载记录功能（30天自动清除）

**功能说明**：为用户操作提供可追溯的记录审计，记录所有上传和下载事件，超过 30 天自动清除，记录不可关闭（强制记录）。

**修复文件**：
- [files.js](file:///workspace/frontend/src/stores/files.js)

**实现内容**（第 33-35 行状态定义 + 第 425-457 行函数实现）：

1. **新增 `transferHistory` 状态**：
   ```javascript
   const transferHistory = ref([]); // 记录列表：{id, type, fileName, size, time, status}
   ```

2. **记录数据结构**：
   ```javascript
   {
     id: 'transfer-{timestamp}-{random}',  // 唯一 ID
     type: 'upload' | 'download',          // 操作类型
     fileName: '文件名.mp4',                // 文件名
     size: 102400,                         // 文件大小（字节）
     time: '2026-06-15T07:47:21Z',         // 操作时间（ISO 8601）
     status: 'success' | 'failed'           // 操作结果
   }
   ```

3. **核心函数**：
   - `addTransferRecord(type, fileName, size, status)`：添加一条新记录，插入到列表最前端，自动调用清理函数
   - `cleanOldTransferHistory()`：使用 30 天阈值过滤记录，将超过时间的记录从列表中移除
   - `getTransferHistory()`：返回最近的 100 条记录

4. **集成位置**：
   - 上传成功（第 293-294 行）：`addTransferRecord('upload', uploadItem.name, uploadItem.size, 'success')`
   - 上传失败（第 321-322 行）：`addTransferRecord('upload', uploadItem.name, uploadItem.size, 'failed')`
   - 下载成功（[files.js](file:///workspace/frontend/src/stores/files.js#L582-L601)）：在 `downloadFile` 中添加记录

5. **30 天自动清除机制**：
   ```javascript
   const TRANSFER_HISTORY_MAX_DAYS = 30; // 记录保留30天，不可关闭

   function cleanOldTransferHistory() {
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - TRANSFER_HISTORY_MAX_DAYS);
     const cutoffTimestamp = cutoffDate.getTime();

     transferHistory.value = transferHistory.value.filter(record => {
       const recordDate = new Date(record.time);
       return recordDate.getTime() >= cutoffTimestamp;
     });
   }
   ```

---

### P2 - 灵动岛遮挡 toast 消息问题

**问题**：展开的灵动岛（Dynamic Island）遮挡了用户操作的 toast 消息，例如点击"添加到播放列表"成功后，用户无法看到"添加成功"提示。

**根本原因**：灵动岛的 `z-index: 9999` 远高于 toast 消息的 z-index，导致在视觉层级上遮挡了 toast。此外 toast 的 `offset: 80` 将消息显示在屏幕顶部区域，与灵动岛位置（top: 16px）重叠。

**修复文件**：
- [DynamicIsland.vue](file:///workspace/frontend/src/components/DynamicIsland.vue#L173-L181)
- [toast.js](file:///workspace/frontend/src/utils/toast.js)

**修复内容**：

1. **降低灵动岛 z-index**（DynamicIsland.vue 第 179 行）：
   ```css
   /* 修复前 */
   z-index: 9999;  // 覆盖所有元素

   /* 修复后 */
   z-index: 1000;  // 让 toast（z-index 通常为 2000）显示在上方
   ```

2. **调整 toast 位置**（toast.js 第 4 行）：
   ```javascript
   // 修复前
   offset: 80  // 距顶部 80px，与灵动岛完全重叠

   // 修复后
   offset: 20  // 距顶部 20px，位于灵动岛上方边缘
   ```

3. **添加自定义类**（toast.js 第 6 行）：
   ```javascript
   customClass: 'app-toast', // 便于后续统一调整样式
   ```

**修复后层级关系**：
- 灵动岛：z-index 1000（展开的音频播放控件）
- Toast 消息：z-index 2000+（Element Plus 默认，高于灵动岛）
- 其他组件：z-index 100 以下

**验证**：点击"添加到播放列表"等产生 toast 的操作，消息可以正确显示在灵动岛上方，用户不会错过操作反馈。

---

### P0 - 数据库与上传目录清理流程

**问题**：测试期间产生的测试文件和数据库记录未清理，导致数据库和上传目录中残留大量测试数据，影响后续测试结果的准确性。

**修复内容**：建立标准清理流程，测试开始前执行以下操作：

1. **清空上传目录**：
   ```bash
   rm -rf /workspace/backend/uploads/*
   ```

2. **重置数据库表**：
   ```sql
   SET FOREIGN_KEY_CHECKS=0;
   TRUNCATE TABLE files;
   TRUNCATE TABLE shares;
   TRUNCATE TABLE audit_logs;
   TRUNCATE TABLE notifications;
   TRUNCATE TABLE playlist_items;
   TRUNCATE TABLE playlists;
   SET FOREIGN_KEY_CHECKS=1;
   ```

**验证**：清理后执行 `mysql> SELECT COUNT(*) FROM files;` 返回 0，上传目录为空，确保测试从干净状态开始。

---

## 2026-06-11 (下午)

### P0 - 文件头检测误报问题（MP4/MOV/M4A等文件被误判为危险）

**问题**：上传MP4等文件时被标记为"危险"，但这些文件已通过 VirusTotal 验证为安全。

**根本原因**：
1. `malwareScanner.js` 的 `suspiciousSignatures` 数组错误地包含了合法媒体文件的签名
2. 文件头签名验证过于严格，未考虑同一格式的不同变体

**受影响的文件类型**：
- MP4（不同大小的 ftyp 框：24/28/32/36字节）
- MOV/QuickTime
- M4A
- WAV/AVI/WebP（RIFF容器格式）
- GIF（不同版本：GIF87a/GIF89a）
- PDF（不同版本号）

**修复文件**：
- [malwareScanner.js](file:///workspace/backend/src/middleware/malwareScanner.js)
- [file-types.js](file:///workspace/backend/src/config/file-types.js)

**修复内容**：
1. 从 `suspiciousSignatures` 中移除误报的签名（MP4、WebM、MP3、RIFF等）
2. 为 MP4/MOV/M4A 添加灵活的 ftyp 标识检测（检测文件开头附近是否包含 `66747970`）
3. 为 RIFF 容器格式（WAV/AVI/WebP）添加格式标识验证
4. 修复签名验证逻辑，使用前缀匹配支持不同长度的签名
5. 添加 `/api/files/rescan` 接口用于重新扫描已上传文件，保持文件列表状态与实时扫描一致

**验证结果**：
- ✅ PNG、JPG、GIF、PDF、WAV、WebP、AVI、MP3、FLAC、OGG 均正确识别为 safe
- ✅ MP4 文件正确识别为 safe
- ✅ 用户提供的 MP4 文件（已通过 VirusTotal 验证）可正常上传

---

### P1 - 上传暂停/停止功能错误

**问题**：
1. 点击暂停按钮后，文件显示"上传失败"，然后自动重新开始上传
2. 点击停止按钮后，文件显示"上传失败"，但实际已停止

**根本原因**：

| 问题 | 原因 |
|------|------|
| 暂停后显示失败 | `uploadSingleFile` 的 `catch` 块将所有 `AbortError` 都当作失败处理 |
| 暂停后自动重传 | `startUploads` 的 while 循环会立即取出暂停的文件并重新开始上传 |
| 停止显示失败 | `pauseUpload` 和 `cancelUpload` 都使用 `controller.abort()`，无法区分 |

**关键问题代码**（[files.js](file:///workspace/frontend/src/stores/files.js)）：
```javascript
// 原代码 - startUploads 会立即取出所有队列中的文件
while (activeUploads.value.length < maxConcurrent && uploadQueue.value.length > 0) {
  const uploadItem = uploadQueue.value.shift();  // ❌ 取出包括暂停的文件
  uploadItem.status = 'uploading';
  activeUploads.value.push(uploadItem);
  uploadSingleFile(uploadItem, folderId, conflictAction);
}
```

**修复文件**：
- [files.js](file:///workspace/frontend/src/stores/files.js)

**修复内容**：

1. **修改 `startUploads` 函数**：
   - 只处理状态为 `pending` 的文件
   - 跳过状态为 `paused` 的文件
   ```javascript
   // 找到第一个状态为 pending 的文件
   const pendingIndex = uploadQueue.value.findIndex(item => item.status === 'pending');
   if (pendingIndex === -1) {
     // 没有待处理的文件，可能都是暂停的
     break;
   }
   const uploadItem = uploadQueue.value.splice(pendingIndex, 1)[0];
   ```

2. **修改 `uploadSingleFile` 函数**：
   - 在 catch 块中区分暂停和取消操作
   - 检查 `uploadItem.status === 'paused'` 来判断是暂停还是取消
   ```javascript
   if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
     if (uploadItem.status === 'paused') {
       // 暂停：保留文件在队列中，不标记为失败
     } else {
       // 取消：标记为失败
       uploadItem.status = 'failed';
       uploadItem.errorReason = '已取消';
     }
   }
   ```

3. **修改 `pauseUpload` 函数**：
   - 先标记状态为 `paused`，再中止请求
   - 将文件添加到队列前端，保留当前进度

4. **修改 `resumeUpload` 函数**：
   - 重置状态为 `pending`，重新开始上传

5. **修改 `finally` 块**：
   - 只在非暂停状态下才从 `activeUploads` 移除

6. **修改 `onUploadProgress` 回调**：
   - 只在 `uploading` 状态下更新进度，避免暂停后的进度跳动

**修复后行为**：

| 操作 | 行为 |
|------|------|
| **暂停** | 文件状态变为 `paused`，保留在队列中，不显示失败，等待用户恢复 |
| **恢复** | 用户点击恢复按钮后，文件状态变为 `pending`，重新开始上传 |
| **取消** | 文件标记为 `failed`，显示"已取消"，不自动重传 |

---

### P0 - 数据库初始化脚本缺少 display_name 列（导致个人资料更新失败）

**问题**：全新初始化数据库后，用户更新个人资料的显示名、用户名、邮箱时报错失败。

**根本原因**：多个数据库初始化文件中 `user_profiles` 表的定义缺少 `display_name` 列：
- `backend/src/config/database.js` (SQLite) - **缺失**
- `backend/setup.sql` (MySQL 初始化脚本) - **缺失**
- `backend/setup.sqlite.sql` (SQLite 初始化脚本) - **缺失**

此外，`database.mysql.js` 中 `playlist_items` 和 `playlists` 表的列名与实际使用代码不一致：

| 表 | 问题 |
|-----|------|
| `playlists` | 缺少 `cover_image` 列 |
| `playlist_items` | 使用了错误的列名（`file_name`, `sort_order` 而非 `file_id`, `order_index`, `added_at`, `account_id`）|

**修复文件**：
- [database.js](file:///workspace/backend/src/config/database.js) - 增加 `display_name TEXT`
- [database.mysql.js](file:///workspace/backend/src/config/database.mysql.js) - 修正 `playlists` 和 `playlist_items` 列定义
- [setup.sql](file:///workspace/backend/setup.sql) - 增加 `display_name VARCHAR(100)`
- [setup.sqlite.sql](file:///workspace/backend/setup.sqlite.sql) - 增加 `display_name TEXT`

**验证结果**：
- ✅ 全新初始化后 14 张表全部正确创建
- ✅ 用户注册成功
- ✅ 个人资料获取成功（`displayName` 默认回退为 username）
- ✅ 个人资料更新成功（用户名、显示名、语言三项均更新成功）
- ✅ 数据库直查确认 `display_name='我的测试名字'`
- ✅ 播放列表创建/获取功能正常

---

### P4 - 播放列表与灵动岛未联动

**问题**：在预览页面点击"添加到播放列表"后，音频仅添加到数据库，没有同时添加到灵动岛播放队列。

**修复内容**：
修改 [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue#L796) 的 `addToExistingPlaylist` 函数：
- 添加成功后，同时将音频添加到灵动岛播放队列
- 如果当前有播放，使用 `addToQueue` 添加到队列
- 如果当前没有播放，使用 `setQueue` 开始新播放

---

### P3 - 播放列表选择器缺少删除按钮

**问题**：播放列表选择器中没有删除播放列表的按钮。

**修复内容**：
1. 在 [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue#L818) 添加 `deletePlaylistItem` 函数
2. 修改播放列表选择器模板，为每个播放列表项添加删除按钮
3. 使用 `@click.stop` 防止点击删除按钮时触发添加操作

---

### P2 - 拖动音量条时静音状态未正确同步

**问题**：点击静音后，拖动音量条时静音图标恢复了，但实际声音仍是静音状态。

**根本原因**：[player.js](file:///workspace/frontend/src/stores/player.js#L224) 的 `setVolume` 函数中，当 `val > 0` 时只设置了 `isMuted.value = false`（视觉状态），但没有同步更新 `audio.value.muted`（实际音频元素属性）。

**修复内容**：
在 `setVolume` 函数的 `val > 0` 分支中，同时设置 `audio.value.muted = false`，确保视觉状态和实际音频元素状态同步。

---

## 2026-06-11

### P0 - user_profiles 表缺少 display_name 列（个人资料更新失败）

**问题**：个人资料页更新用户名、邮箱、显示名时报错失败。

**根本原因**：
1. `user_profiles` 表中缺少 `display_name` 列
2. 后端 `updateProfile` 函数（[UserController.js](file:///workspace/backend/src/controllers/UserController.js)）尝试向 `user_profiles` 表写入 `display_name` 字段，但该列不存在，导致 SQL 错误
3. 数据库初始化脚本（[database.mysql.js](file:///workspace/backend/src/config/database.mysql.js#L123)）中已定义 `display_name` 列，但现有数据库未正确同步

**修复内容**：
1. 执行 SQL：`ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(100) DEFAULT NULL AFTER language;`
2. 验证：`displayName`、`username`、`email` 三项更新均返回 `success: true`

---

### P1 - 灵动岛播放列表行为错误（每次点击替换队列）

**问题**：每次点击音频文件都单独播放，没有形成播放列表。

**根本原因**：[Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue#L805) 中的 `playInIsland` 函数使用 `playerStore.setQueue()` 每次都**替换**整个播放队列，导致新点击的文件替代了之前的内容。

**修复内容**：
修改 `playInIsland` 函数逻辑：
- 如果当前有播放中的内容（`currentIndex >= 0`），使用 `addToQueue` 添加到队列
- 如果当前没有播放，使用 `setQueue` 开始新的播放列表

**修复后行为**：
- 点击第一个音频 → 开始播放
- 点击第二个、第三个音频 → 添加到播放队列
- 用户可在灵动岛展开后的队列列表中看到所有添加的音频

---

## 2026-06-10

### P0 - MySQL LIMIT/OFFSET 预处理语句参数类型错误（通知 400）

**问题**：打开通知中心或登录日志时，前端请求返回 400 错误，后端日志报 `ER_WRONG_ARGUMENTS: Incorrect arguments to mysqld_stmt_execute`。

**根本原因**：`mysql2` 的 `pool.execute()` 使用 MySQL 预处理语句（Prepared Statement），`LIMIT ? OFFSET ?` 的占位符参数被当作字符串绑定到 SQL 语句中，但 MySQL 要求这两个位置必须是整数字面量。使用 `?` 占位符 + `params.push(limit, offset)` 传参被 MySQL 拒绝。

**受影响的 API**：

| 端点 | 文件 | 现象 |
|------|------|------|
| `GET /api/notifications` | [notifications.js](file:///workspace/backend/src/routes/notifications.js) | 通知中心请求失败 |
| `GET /api/security/login-logs` | [security.js](file:///workspace/backend/src/routes/security.js) | 登录日志请求失败 |

**修复内容**：
1. 将 `LIMIT ? OFFSET ?` 占位符改为直接嵌入已验证的数字：`LIMIT ${limit} OFFSET ${offset}`
2. 数字参数已经过 `parseInt()` 和上限约束（如 `Math.min(limit, 100)`），无 SQL 注入风险
3. 数据库查询使用 `asyncAll` / `asyncGet` 保持一致

**验证**：通过 curl 模拟登录并请求 `/api/notifications` 和 `/api/security/login-logs`，返回 `success: true`，数据正确。

---

### P1 - 用户名 `filecloud` 被误判为已占用

**问题**：注册页输入用户名 `filecloud` 时提示"用户名被占用"，但数据库中该账号不存在。

**根本原因**：
1. [validators.js](file:///workspace/backend/src/utils/validators.js) 中 `sensitiveWords = ['admin', 'root', 'system', 'filecloud', 'moderator', 'support']` 将品牌名 `filecloud` 误列入敏感词黑名单
2. [Register.vue](file:///workspace/frontend/src/views/Register.vue#L382) 的 `checkUsernameAvailability` 只判断 `response.data.available`，未区分"用户名验证不通过"（`valid=false`）和"账号已存在"（`available=false`），一律显示"用户名被占用"

**修复文件**：
- [validators.js](file:///workspace/backend/src/utils/validators.js)
- [Register.vue](file:///workspace/frontend/src/views/Register.vue)
- [i18n.js](file:///workspace/frontend/src/stores/i18n.js)

**修复内容**：
1. **移除品牌词**：`sensitiveWords` 从 `['admin', 'root', 'system', 'filecloud', 'moderator', 'support']` 改为 `['admin', 'root', 'system', 'moderator', 'support']`
2. **前端状态分支**：`checkUsernameAvailability` 新增 `invalid` 状态判断：
   - `response.success && !response.data.valid` → 显示后端返回的具体错误信息（如"用户名包含禁用词汇"）
   - `response.success && !response.data.available` → 显示"用户名被占用"
   - `response.success && response.data.available` → 显示"用户名可用"
3. **状态机变量**：新增 `usernameCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'`，模板中新增 `invalid` 分支的 `warning-icon + error message` 展示

---

### P2 - i18n 翻译缺失：passwordStrength.noWeak / excellent

**问题**：注册页密码强度区域显示 `passwordStrength.noWeak` 原始字符串（未翻译）。

**根本原因**：[i18n.js](file:///workspace/frontend/src/stores/i18n.js#L25) 的 `passwordStrength` 对象缺少 `noWeak`（"未使用常见弱密码模式"）和 `excellent`（"极佳"）两个翻译键；组件中以 `i18n.t('passwordStrength.noWeak')` 访问时找不到 key，原样返回原始字符串。

**修复文件**：
- [i18n.js](file:///workspace/frontend/src/stores/i18n.js)

**修复内容**：
1. **英文语言包**补充：
   - `passwordStrength.excellent = 'Excellent'`
   - `passwordStrength.noWeak = 'No common patterns'`
2. **中文语言包**补充：
   - `passwordStrength.excellent = '极佳'`
   - `passwordStrength.noWeak = '不使用常见弱密码'`

---

### P1 - 统一的输入框字符过滤与警告提示（补充）

**问题**：分享页面搜索框、管理员后台用户搜索框、安全设置页面所有输入框缺少字符过滤；过滤警告提示与输入框距离过近影响视觉。

**修复文件**：
- [inputFilter.js](file:///workspace/frontend/src/utils/inputFilter.js)
- [Admin/Users.vue](file:///workspace/frontend/src/views/Admin/Users.vue)
- [SecuritySettings.vue](file:///workspace/frontend/src/views/SecuritySettings.vue)
- [Login.vue](file:///workspace/frontend/src/views/Login.vue)
- [Register.vue](file:///workspace/frontend/src/views/Register.vue)

**修复内容**：
1. **分享页面搜索框**：使用 `filterSearch` 规则，允许中文文字，仅过滤特殊字符和 emoji
2. **管理员后台用户搜索框**：从自定义的简单过滤（仅过滤控制字符）改为统一的 `filterUsername` 规则（a-zA-Z0-9_-），并添加过滤警告提示
3. **安全设置页面输入框**：
   - SMTP 主机：使用 `filterSearch` 过滤，添加警告提示
   - SMTP 端口：自定义规则（仅允许数字 0-9，限制 5 位），添加警告提示
   - SMTP 用户：使用 `filterEmail` 过滤，添加警告提示
   - SMTP 发件人名称：使用 `filterSearch` 过滤，添加警告提示
   - VirusTotal API Key：过滤控制字符，添加警告提示
   - 测试邮件收件人：使用 `filterEmail` 过滤，添加警告提示
4. **过滤警告样式**：所有过滤警告 `.filter-warning` 添加 `margin-top: 8px`，与输入框保持适当视觉距离

---

### P1 - 验证码组件移动端布局与交互优化

**问题**：验证码图片与输入框在移动端纵向堆叠，占用空间过大；hover 时有多余的浮动动画和刷新提示遮罩，用户希望简化。

**修复文件**：
- [Captcha.vue](file:///workspace/frontend/src/components/Captcha.vue)

**修复内容**：
1. **移动端布局**：将移动端 `flex-direction: column` 改为 `flex-direction: row`，验证码图片与输入框保持在同一行
2. **移除 hover 动画**：移除 `transform: translateY(-2px)` 浮动动画
3. **移除刷新提示遮罩**：移除 hover 时显示的刷新图标遮罩层
4. **保留核心功能**：点击刷新验证码功能不变，加载状态显示不变

---

### 各输入框过滤规则对照表

| 位置 | 输入框 | 过滤规则 | 允许内容 |
|------|--------|----------|----------|
| 登录/注册 | 用户名 | `filterUsername` | a-zA-Z0-9_- |
| 登录/注册 | 邮箱 | `filterEmail` | 邮箱合法字符 |
| 登录/注册 | 密码 | 无（不做字符过滤） | 任意字符 |
| 验证码 | 验证码 | `filterCaptcha` | a-zA-Z0-9 |
| Dashboard | 文件名/文件夹名 | `filterFolderName` | 除特殊字符外 |
| Dashboard | 搜索框 | `filterSearch` | 允许中文，过滤 emoji/特殊字符 |
| 分享页面 | 搜索框 | `filterSearch` | 允许中文，过滤 emoji/特殊字符 |
| 管理员后台 | 用户搜索 | `filterUsername` | a-zA-Z0-9_- |
| 安全设置 | SMTP 主机 | `filterSearch` | 允许中文，过滤 emoji/特殊字符 |
| 安全设置 | SMTP 端口 | 自定义（仅数字） | 0-9，最多 5 位 |
| 安全设置 | SMTP 用户 | `filterEmail` | 邮箱合法字符 |
| 安全设置 | SMTP 发件人 | `filterSearch` | 允许中文，过滤 emoji/特殊字符 |
| 安全设置 | API Key | 自定义（控制字符） | 除控制字符外 |
| 安全设置 | 测试收件人 | `filterEmail` | 邮箱合法字符 |
| 个人设置 | 用户名 | `filterUsername` | a-zA-Z0-9_- |
| 个人设置 | 邮箱 | `filterEmail` | 邮箱合法字符 |
| 个人设置 | 显示名称 | `filterDisplayName` | 字母、数字、空格、下划线、连字符 |

---

### P0 - 登录后页面持续加载不跳转

**问题**：登录成功后页面一直显示加载状态，没有跳转到 dashboard。

**根本原因**：
1. `RegionDetector.vue` 第252行存在 CSS 语法错误（`<.message-text {`）
2. `authStore` 中多个函数返回值不一致（有的返回 `response`，有的返回 `response.data`）
3. Axios 响应拦截器已解包返回 `response.data`，但部分业务代码又访问 `.data`
4. Token 未单独保存到 localStorage，导致后续请求无法获取认证 token
5. 请求拦截器未注入 CSRF token

**修复文件**：
- [RegionDetector.vue](file:///workspace/frontend/src/components/RegionDetector.vue)
- [auth.js](file:///workspace/frontend/src/stores/auth.js)
- [files.js](file:///workspace/frontend/src/stores/files.js)
- [api/index.js](file:///workspace/frontend/src/api/index.js)
- [UploadProgress.vue](file:///workspace/frontend/src/components/UploadProgress.vue)
- [NotificationCenter.vue](file:///workspace/frontend/src/components/NotificationCenter.vue)

**修复内容**：
1. **CSS 语法错误修复**：`RegionDetector.vue` 第252行 `<.message-text {` 改为 `.message-text {`
2. **返回值一致性修复**：`loginWithTwoFactor`、`register`、`verifyTwoFactor`、`disableTwoFactor`、`changePassword` 函数统一返回 `response.data`
3. **文件冲突检测修复**：`uploadSingleFile` 中 `response.conflicts` 改为 `response.data.conflicts`
4. **createFolder 返回值修复**：统一返回 `response.data`
5. **Token 存储修复**：`loadFromStorage` 和 `saveToStorage` 函数单独保存/加载 token 到 localStorage
6. **CSRF Token 注入**：`api/index.js` 请求拦截器添加 `X-CSRF-Token` header 注入
7. **Computed 修改问题**：`UploadProgress.vue` 重试上传改为调用 `filesStore.retryUpload()`，避免直接修改 computed 返回值
8. **Store 直接修改问题**：`NotificationCenter.vue` 标记已读/删除改为通过 emit 通知父组件处理
9. **新增 retryUpload 函数**：在 filesStore 中添加单个文件重试功能

---

### P1 - 区域选择对话框逻辑优化

**问题**：区域选择对话框逻辑不够清晰，用户无法控制是否继续显示。

**修复文件**：
- [RegionDetector.vue](file:///workspace/frontend/src/components/RegionDetector.vue)

**修复内容**：
1. 仅在用户勾选"不再弹出"后，才保存 `regionDialogNeverShow` 状态到 localStorage
2. 检测方案调整：优先使用 IP 地址检测，浏览器语言作为备用方案
3. 模板语法修复：提取 `checkboxLabel` computed 属性，避免在 Vue 模板 attribute 中使用转义字符

---

### P1 - Element Plus 语言包未配置

**问题**：Element Plus 组件内部文案（日期选择器、表单提示、分页等）不会跟随 i18n 切换。

**修复文件**：
- [main.js](file:///workspace/frontend/src/main.js)

**修复内容**：
1. 导入 Element Plus 中英文语言包：`import zhCn from 'element-plus/dist/locale/zh-cn.mjs'` 和 `import en from 'element-plus/dist/locale/en.mjs'`
2. `app.use(ElementPlus)` 时根据 `i18nStore.currentLocale` 动态设置 locale

---

## 2026-06-09

### P0 - 文件上传 Content-Type 导致文件无法上传

**问题**：文件上传显示成功，进度条完成，但后端日志和数据库没有记录。

**根本原因**：axios 实例默认设置 `Content-Type: application/json`，而 FormData 上传需要浏览器自动设置 `multipart/form-data` 和 `boundary`。手动设置会覆盖浏览器的自动设置，导致 multer 无法解析。

**修复文件**：
- [index.js](file:///workspace/frontend/src/api/index.js)
- [files.js (frontend store)](file:///workspace/frontend/src/stores/files.js)
- [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue)
- [files.js (backend routes)](file:///workspace/backend/src/routes/files.js)

**修复内容**：
1. axios 实例移除默认 Content-Type
2. 请求拦截器中仅在非 FormData 请求时设置 `Content-Type: application/json`
3. 上传方法移除手动 Content-Type
4. 前端 `startUploads()` 参数传递完善
5. 后端新增空文件检查，返回 `NO_FILES_UPLOADED` 错误

---

### P1 - 中文标点文件名过滤与前端 conflicts 处理

**问题**：文件名含中文标点（如 `诡异婚配：我诡帝，老婆软糯校花.txt`）被拒绝上传，且前端没有显示错误原因。

**修复文件**：
- [validators.js (backend)](file:///workspace/backend/src/middleware/validators.js)
- [files.js (frontend store)](file:///workspace/frontend/src/stores/files.js)
- [file-types.js (backend config)](file:///workspace/backend/src/config/file-types.js)

**修复内容**：
1. **文件名允许中文标点**：白名单增加中文标点字符（`：，。（）【】《》等`）
2. **文件夹名保持原限制**：不允许中文标点（防止路径问题）
3. **前端处理 conflicts**：后端返回 conflicts 数组时，前端显示警告提示，不标记文件为成功
4. **上传进度条优化**：网络上传显示进度，后端处理显示"处理中"，上传完成后自动清空列表区域
5. **SVG 完全禁止**：添加到 blockedExtensions，防止 XSS 脚本注入

---

### P1 - 安全加固：JWT/限流/CSRF/路径遍历/错误信息隐藏

**问题**：从攻击者视角审视，发现多项安全隐患。

**修复文件**：
- [jwt.js](file:///workspace/backend/src/utils/jwt.js)
- [encryption.js](file:///workspace/backend/src/utils/encryption.js)
- [security.js](file:///workspace/backend/src/utils/security.js)
- [rate-limit.js](file:///workspace/backend/src/middleware/rate-limit.js)
- [token-blacklist.js](file:///workspace/backend/src/middleware/token-blacklist.js)
- [auth.js (routes)](file:///workspace/backend/src/routes/auth.js)
- [files.js (routes)](file:///workspace/backend/src/routes/files.js)
- [UserController.js](file:///workspace/backend/src/controllers/UserController.js)
- [error.js (middleware)](file:///workspace/backend/src/middleware/error.js)
- [server.js](file:///workspace/backend/server.js)
- [.env](file:///workspace/backend/.env)

**修复内容**：

| 问题 | 修复 |
|------|------|
| JWT/加密密钥硬编码 | 改为环境变量读取，未设置则用 `crypto.randomBytes` 动态生成 |
| Token 24h 过期过长 | 缩短至 4 小时 |
| 缺少 Rate Limiting | 登录 5次/15min，注册 10次/15min，返回 429 |
| Logout 不失效 token | Token ID 加入黑名单中间件 |
| CORS 过宽（origin: true） | 改为白名单（localhost:5173/3000） |
| Cookie sameSite=lax | 改为 strict |
| 头像路径遍历 | `safePath()` 规范化路径 + 边界检查 |
| 搜索 LIKE 注入 | `sanitizeLikePattern()` 转义 `% _ \` |
| Math.random 文件名 | 改用 `crypto.randomBytes` |
| 验证码明文存储 | 改用 bcrypt 哈希存储 |
| 错误信息暴露内部 | 生产环境隐藏详细错误堆栈 |
| MySQL root 无密码 | 已设置密码，MySQL/ClamAV 使用 UNIX Socket 连接 |

---

## 2026-06-08

### P0 - 文件类型白名单重构

**问题**：`allowedExtensions` 包含高危文件类型（可执行脚本、压缩包、旧版 Office）。

**修复文件**：
- [file-types.js (backend)](file:///workspace/backend/src/config/file-types.js)
- [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue)

**修复内容**：
1. 后端白名单仅保留安全文件类型（图片、PDF、无宏 Office、纯文本、音视频）
2. 禁止：可执行文件、脚本、压缩包、配置文件、数据库文件、证书密钥、旧版 Office
3. 为所有允许的文件类型添加文件头签名（魔数）验证
4. 前端预览函数与后端白名单同步

---

### P0 - 头像上传安全增强

**问题**：头像上传缺少专门的安全验证，存在 XSS 注入风险（如 SVG）。

**修复文件**：
- [fileValidator.js (backend)](file:///workspace/backend/src/middleware/fileValidator.js)
- [user.js (backend routes)](file:///workspace/backend/src/routes/user.js)
- [UserController.js](file:///workspace/backend/src/controllers/UserController.js)

**修复内容**：
1. 新增 `validateAvatar` 中间件，专门用于头像安全验证
2. 头像仅允许：`PNG, JPG, JPEG, GIF, WebP, BMP`，**禁止 SVG**（防止 XSS）
3. 文件签名验证 + MIME 类型验证 + 扩展名白名单 + 大小限制（5MB）

---

### P0 - 个人资料页邮箱验证 400 错误

**问题**：中文用户名/邮箱在 GET 请求 URL 参数中编码异常。

**修复文件**：
- [user.js (backend routes)](file:///workspace/backend/src/routes/user.js)
- [UserController.js](file:///workspace/backend/src/controllers/UserController.js)
- [index.js (frontend API)](file:///workspace/frontend/src/api/index.js)

**修复内容**：`check-username` / `check-email` 接口从 GET 改为 POST，参数通过请求体传递。

---

### P1 - 完整的用户信息验证机制

**问题**：各模块分散验证，缺少统一的用户信息验证工具。

**修复文件**：
- [validators.js (backend)](file:///workspace/backend/src/middleware/validators.js)
- [auth.js (backend routes)](file:///workspace/backend/src/routes/auth.js)
- [UserController.js](file:///workspace/backend/src/controllers/UserController.js)
- [Settings.vue](file:///workspace/frontend/src/views/Settings.vue)

**修复内容**：
1. 新建统一验证工具模块 `validators.js`
2. `validateUsername()` / `validateEmail()` / `validatePassword()` / `validateFilename()` / `validateFoldername()` / `validateDisplayName()`
3. 注册/修改资料流程中使用统一验证
4. 前端增强对应验证逻辑

---

### P1 - 文件名和文件夹名安全验证完善

**问题**：上传/创建文件和文件夹缺少统一的文件名安全验证入口。

**修复文件**：
- [files.js (backend routes)](file:///workspace/backend/src/routes/files.js)

**修复内容**：
1. 创建文件夹接口添加 `validateFoldername()` 验证
2. 重命名文件接口添加对应验证
3. 上传文件接口添加 `validateFilename()` 验证

---

### P1 - 字符过滤白名单+黑名单混合模式

**问题**：原过滤规则过于简单，无法正确处理中文与标点等合法字符，同时也不能有效阻止危险字符。

**修复文件**：
- [validators.js (backend)](file:///workspace/backend/src/middleware/validators.js)
- [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue)

**修复内容**：
1. 实现白名单+黑名单混合模式验证
2. 允许字符：中文、英文、数字、英文标点符号
3. 禁止字符：emoji、路径危险字符、控制字符
4. 新增 `hasDisallowedCharacters()` 和 `CHINESE_PUNCTUATION_REGEX`

---

### P1 - 输入框字符过滤警告与长度限制

**问题**：输入框缺少字符过滤提示与长度控制，非法输入无用户友好反馈。

**修复文件**：
- [Dashboard.vue](file:///workspace/frontend/src/views/Dashboard.vue)
- [Settings.vue](file:///workspace/frontend/src/views/Settings.vue)
- [Register.vue](file:///workspace/frontend/src/views/Register.vue)
- [Login.vue](file:///workspace/frontend/src/views/Login.vue)

**修复内容**：
1. 文件名/文件夹名输入框：过滤非法字符，显示"部分字符不支持，已自动过滤"黄色警告
2. 用户名输入框：严格限制（字母、数字、下划线、连字符）
3. 所有输入框添加 `maxlength` 限制和 `show-word-limit` 字数统计
4. 所有输入框添加 `clearable` 一键清空按钮
5. 长度规范：用户名 3-50、邮箱 ≤100、密码 8-128、显示名称 ≤100

---

### P1 - 登录错误消息详细分类

**问题**：登录失败原因不区分，用户无法判断是账号问题还是密码问题。

**修复文件**：
- [auth.js (backend routes)](file:///workspace/backend/src/routes/auth.js)
- [Login.vue](file:///workspace/frontend/src/views/Login.vue)

**修复内容**：
1. 后端区分：用户名不存在、密码错误、账户禁用、账户锁定、空输入等场景
2. 前端建立错误代码到友好消息映射
3. 提供用户友好的操作建议

---

### P1 - 登录页错误消息国际化

**问题**：登录页错误消息硬编码中文，未走 i18n 翻译。

**修复文件**：
- [i18n.js](file:///workspace/frontend/src/stores/i18n.js)
- [Login.vue](file:///workspace/frontend/src/views/Login.vue)

**修复内容**：
1. 修复 i18n 翻译结构，错误代码放入语言对象内
2. 登录页移除硬编码中文错误消息，统一使用 `i18n.t()` 翻译
3. 修复 `i18n.t()` 函数，添加类型检查防止传入非字符串时 Vue 渲染错误

---

### P1 - 前端加载屏 Loading Screen

**问题**：原展示型首屏与应用功能重叠，进入应用前需要统一加载状态提示。

**修复文件**：
- [index.html](file:///workspace/frontend/index.html)
- [main.js](file:///workspace/frontend/src/main.js)

**修复内容**：
1. 将展示型首屏改为纯 Loading 屏
2. 添加渐变紫蓝色背景 + FileCloud Logo + 旋转加载动画
3. Vue 应用挂载完成后由 main.js 添加 `hidden` class 自动隐藏
4. 加载屏使用 `position: fixed; z-index: 9999` 确保全屏覆盖且不干扰后续内容

---

### P1 - 数据库完整备份

**问题**：无数据库结构版本管理。

**修复内容**：导出 MySQL `fileserver` 数据库完整结构，用于版本管理和问题回溯。

---

### P2 - MySQL / ClamAV 服务启动脚本

**问题**：缺少便捷的本地开发环境启动脚本。

**修复文件**：
- [start-mysql.sh](file:///workspace/start-mysql.sh)
- [start-clamav.sh](file:///workspace/start-clamav.sh)
- [start-all.sh](file:///workspace/start-all.sh)
- [stop-all.sh](file:///workspace/stop-all.sh)
- [start-mysql.ps1](file:///workspace/start-mysql.ps1)
- [start-clamav.ps1](file:///workspace/start-clamav.ps1)
- [start-all.ps1](file:///workspace/start-all.ps1)
- [stop-all.ps1](file:///workspace/stop-all.ps1)

**修复内容**：
1. Linux Bash + Windows PowerShell 双平台启动脚本
2. 自动检测 MySQL/ClamAV 安装
3. 集成 freshclam 病毒库更新
4. 一站式启动/停止前后端服务

---

## 2026-06-07

### P1 - 安全设置页面权限控制

**修复文件**：
- [AppLayout.vue](file:///workspace/frontend/src/components/AppLayout.vue)
- [router/index.js](file:///workspace/frontend/src/router/index.js)

**修复内容**：
1. 安全设置入口仅在 `user.role === 'admin'` 时显示
2. `/security-settings` 路由添加 `meta: { requiresAdmin: true }`
3. 修正 admin.js 中误导性注释

---

### P0 - 服务器重启后登录状态丢失

**修复文件**：
- [auth.js (frontend store)](file:///workspace/frontend/src/stores/auth.js)

**修复内容**：
1. 移除 `init()` 和 `fetchUser()` 中错误的 `localStorage.removeItem(STORAGE_KEY)` 调用
2. API 调用失败时不清除用户状态，保留 localStorage 数据
3. 由响应拦截器在 401 时正确处理登出逻辑

---

### P1 - i18n 翻译函数错误与硬编码问题

**修复文件**：
- [i18n.js](file:///workspace/frontend/src/stores/i18n.js)
- [Users.vue](file:///workspace/frontend/src/views/Admin/Users.vue)

**修复内容**：
1. `i18n.t()` 添加类型检查，传入非字符串时直接返回原值避免 `TypeError`
2. Users.vue 移除硬编码英文文本（Admin/Member/GB/Unlimited 等），统一使用翻译键
3. 添加缺失的翻译键中英文对照

---

## 2026-06-06

### P0 - 服务器无法访问问题排查与解决

**问题**：`http://localhost:5173` 无法访问。

**修复内容**：停止残留进程，重新安装依赖，重启前后端服务验证。

---

### P0 - 后端文件夹创建 API 端点缺失

**修复文件**：
- [files.js (backend routes)](file:///workspace/fileserver-new/backend/src/routes/files.js)

**修复内容**：新增 `POST /api/files/folders` 接口，支持创建文件夹。

---

### P0 - 前端硬编码中文消息国际化

**修复文件**：
- [files.js (frontend store)](file:///workspace/fileserver-new/frontend/src/stores/files.js)
- [i18n.js](file:///workspace/fileserver-new/frontend/src/stores/i18n.js)

**修复内容**：将 files store 中硬编码中文 toast 消息替换为 `i18n.t()` 调用。

---

## 2026-06-03

### P1 - 主题切换功能完整实现

**修复文件**：
- [i18n.js](file:///workspace/fileserver-new/frontend/src/stores/i18n.js)
- [Settings.vue](file:///workspace/fileserver-new/frontend/src/views/Settings.vue)
- [App.vue](file:///workspace/fileserver-new/frontend/src/App.vue)

**修复内容**：支持亮色/暗色/系统三种主题，通过 CSS 变量切换，localStorage 持久化。

---

### P1 - 头像上传功能完善

**修复文件**：
- [Settings.vue](file:///workspace/fileserver-new/frontend/src/views/Settings.vue)

**修复内容**：添加头像上传状态反馈、错误处理、删除头像功能。

---

### P0 - Stats API FILE_NOT_FOUND 错误

**问题**：`/api/files/stats` 被 `/:id` 路由错误匹配。

**修复内容**：调整路由顺序，确保具体路由优先于带参数路由。

---

### P1 - 回收站恢复冲突对话框

**修复文件**：
- [Trash.vue](file:///workspace/fileserver-new/frontend/src/views/Trash.vue)

**修复内容**：添加 `FileConflictDialog` 模板引用，支持保留两个/替换/合并/跳过。

---

### P1 - 保留两个文件逻辑优化

**修复文件**：
- [files.js (backend routes)](file:///workspace/fileserver-new/backend/src/routes/files.js)

**修复内容**：优化 `generateUniqueName`，多次上传时正确生成 `文件_副本`、`文件_副本(2)`、`文件_副本(3)` 递增文件名。

---

## 2026-04

历史修复记录迁移至此，涵盖早期功能开发和问题修复。

---

## 记录规范

- 日期格式：`YYYY-MM-DD`
- 优先级：P0（紧急）> P1（重要）> P2（一般）> P3（优化）
- 每条记录包含：问题描述、修复文件、修复内容
- 链接格式：`[文件名](file:///路径)`
