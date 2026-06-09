# 修复日志

本文件记录项目开发过程中遇到的问题及修复方案。按日期倒序排列，优先显示最新修复。

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
