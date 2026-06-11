# 修复日志

本文件记录项目开发过程中遇到的问题及修复方案。按日期倒序排列，优先显示最新修复。

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
