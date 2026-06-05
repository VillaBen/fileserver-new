
# 开发指南

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 后端开发

```bash
cd backend
npm install
npm start
```

后端服务运行在 `http://localhost:3000`

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器运行在 `http://localhost:5173`

---

## 项目结构

### 后端结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js     # 数据库配置
│   ├── constants/
│   │   ├── config.js       # 配置常量
│   │   └── errorCodes.js   # 错误码
│   ├── controllers/       # 控制器
│   │   ├── AdminController.js
│   │   ├── ApiTokenController.js
│   │   ├── SystemSettingsController.js
│   │   └── UserController.js
│   ├── middleware/        # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   ├── error.js        # 错误处理
│   │   └── response.js     # 响应处理
│   ├── routes/           # 路由
│   │   ├── auth.js         # 认证路由
│   │   ├── files.js        # 文件路由
│   │   ├── shares.js       # 分享路由
│   │   ├── user.js         # 用户路由
│   │   ├── admin.js        # 管理员路由
│   │   ├── captcha.js      # 验证码路由
│   │   └── apiTokens.js    # API Token 路由
│   └── utils/            # 工具
│       ├── encryption.js   # 加密工具
│       ├── jwt.js          # JWT 工具
│       └── response.js     # 响应工具
├── database/
│   └── fileserver.db    # SQLite 数据库
├── uploads/            # 文件存储
├── public/             # 静态文件
├── server.js           # 服务器入口
├── package.json
└── .env
```

### 前端结构

```
frontend/
├── src/
│   ├── api/            # API 调用
│   │   ├── client.js       # Axios 客户端配置
│   │   └── index.js        # API 接口定义
│   ├── components/     # Vue 组件
│   │   ├── AppLayout.vue        # 主布局
│   │   ├── Captcha.vue          # 验证码组件
│   │   ├── PasswordStrength.vue  # 密码强度指示器
│   │   ├── LanguageSelector.vue  # 语言选择器
│   │   ├── TwoFactorSetup.vue    # 双因素认证设置
│   │   ├── EmptyState.vue        # 空状态提示 ✅
│   │   ├── FileCard.vue          # 文件卡片 ✅
│   │   ├── LoadingSpinner.vue     # 加载动画 ✅
│   │   └── ConfirmDialog.vue      # 确认对话框 ✅
│   ├── router/        # 路由
│   │   └── index.js        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   │   ├── auth.js         # 认证状态
│   │   ├── files.js         # 文件状态
│   │   └── i18n.js          # 国际化状态
│   ├── utils/         # 工具函数
│   │   ├── format.js        # 格式化工具
│   │   ├── device.js        # 设备检测
│   │   └── toast.js         # 消息提示
│   ├── views/         # 页面视图
│   │   ├── Landing.vue           # 着陆页 ✅
│   │   ├── Login.vue             # 登录页 ✅
│   │   ├── Register.vue          # 注册页 ✅
│   │   ├── ForgotPassword.vue    # 忘记密码
│   │   ├── Dashboard.vue         # 文件管理 ✅ 已完善
│   │   ├── Settings.vue          # 设置页
│   │   ├── Shares.vue            # 分享管理
│   │   ├── Trash.vue             # 回收站
│   │   └── Admin/               # 管理员页面
│   │       ├── AdminDashboard.vue
│   │       ├── Users.vue
│   │       └── AuditLogs.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
└── package.json
```

---

## 已完成功能

### Sprint 1: 核心文件管理 ✅

- ✅ 文件/文件夹列表展示（网格视图）
- ✅ 文件/文件夹列表展示（列表视图）
- ✅ 文件上传功能（UI + 交互）
- ✅ 拖放上传支持（UI）
- ✅ 文件夹创建功能
- ✅ 文件/文件夹删除（带确认对话框）
- ✅ 文件下载功能（UI）
- ✅ 文件预览功能（UI）
- ✅ 文件重命名功能（带对话框）
- ✅ 文件搜索功能
- ✅ 视图模式切换（网格/列表）
- ✅ 统计卡片显示（UI）

### 通用组件

| 组件 | 文件 | 状态 |
|------|------|------|
| EmptyState | `components/EmptyState.vue` | ✅ |
| FileCard | `components/FileCard.vue` | ✅ |
| LoadingSpinner | `components/LoadingSpinner.vue` | ✅ |
| ConfirmDialog | `components/ConfirmDialog.vue` | ✅ |
| Captcha | `components/Captcha.vue` | ✅ |
| PasswordStrength | `components/PasswordStrength.vue` | ✅ |
| LanguageSelector | `components/LanguageSelector.vue` | ✅ |
| TwoFactorSetup | `components/TwoFactorSetup.vue` | ✅ |

### 国际化

- ✅ 200+ 中英文翻译键
- ✅ 所有主要页面已集成
- ✅ Dashboard 所有文本已使用 i18n

---

## 加密模块

加密工具位于 `backend/src/utils/encryption.js`：

### 功能

- `encrypt(text)` - AES-256-CBC 加密文本
- `decrypt(encryptedText)` - AES-256-CBC 解密文本
- `hashPassword(password)` - bcrypt 哈希密码
- `verifyPassword(password, hash)` - bcrypt 验证密码
- `encryptFile(inputPath, outputPath)` - 加密文件
- `decryptFile(inputPath, outputPath)` - 解密文件
- `decryptFileToStream(inputPath, res)` - 解密并流式传输
- `getFileHash(filePath)` - 获取文件 SHA-256 哈希

---

## 认证流程

### JWT 认证

1. 用户登录 → 获取 JWT Token
2. Token 存储在 Cookie (`token`)
3. 请求时通过 Cookie 或 Header 携带 Token
4. 中间件 `requireAuth` 验证 Token

### 认证中间件

```javascript
// routes 中使用
const { requireAuth, requireAdmin } = require('../middleware/auth');

app.use('/api/user', requireAuth, userRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);
```

---

## 待开发功能

详细的开发计划和待办事项请查看: [前端开发计划](../frontend/DEVELOPMENT_PLAN.md)

### 优先级 P0（必须完成）
- Settings 页面完整功能
- 认证流程与后端 API 联调
- 分享管理页面
- 回收站页面

### 优先级 P1（应该完成）
- 管理员后台
- 用户菜单
- 通知系统

### 优先级 P2（锦上添花）
- 高级文件功能
- 性能优化
- 测试覆盖

---

## 相关文档

- [API 文档](API.md)
- [数据库设计](DATABASE.md)
- [部署文档](DEPLOYMENT.md)
- [修复日志](BUGFIX.md)
- [前端开发计划](../frontend/DEVELOPMENT_PLAN.md)

---

**更新日期**: 2026-06-02  
**更新内容**: 添加前端结构详情、已完成功能列表、通用组件清单
