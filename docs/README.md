# FileCloud

一个功能完整的文件服务器应用，提供文件管理、用户认证、安全存储等功能。

## 功能特性

### 核心功能
- ✅ 用户注册/登录
- ✅ JWT 身份认证
- ✅ 文件上传/下载
- ✅ 文件管理（网格/列表视图）
- ✅ 文件搜索
- ✅ 文件重命名/删除
- ✅ 文件夹创建
- ✅ 回收站功能
- ✅ 文件分享
- ✅ 个人资料管理
- ✅ API Token 管理
- ✅ 国际化（中文/英文）

### 安全特性
- ✅ 密码 bcrypt 加密存储
- ✅ AES-256-CBC 数据加密
- ✅ 文件端到端加密
- ✅ 邮箱地址加密
- ✅ API Token 加密
- ✅ 审计日志

### 管理功能
- ✅ 管理员仪表盘
- ✅ 用户管理
- ✅ 审计日志查看

## 技术栈

### 后端
- Node.js + Express
- SQLite 3
- JWT 认证
- AES-256-CBC 加密

### 前端
- Vue 3 + Vite
- Pinia (状态管理)
- Vue Router (路由)
- Element Plus (UI组件库)
- i18n (国际化)

## 快速开始

### 后端

```bash
cd backend
npm install
npm start
```

后端服务运行在 `http://localhost:3000`

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器运行在 `http://localhost:5173`

## 项目结构

```
fileserver-new/
├── backend/
│   ├── src/
│   │   ├── config/         # 配置
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── routes/         # 路由
│   │   └── utils/          # 工具
│   ├── database/           # 数据库文件
│   ├── uploads/            # 文件存储
│   └── server.js          # 入口文件
│
├── frontend/
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/     # Vue 组件
│   │   │   ├── AppLayout.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── FileCard.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   ├── ConfirmDialog.vue
│   │   │   ├── Captcha.vue
│   │   │   ├── PasswordStrength.vue
│   │   │   ├── LanguageSelector.vue
│   │   │   └── TwoFactorSetup.vue
│   │   ├── router/        # 路由配置
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── utils/         # 工具函数
│   │   ├── views/         # 页面视图
│   │   │   ├── Dashboard.vue  ✅ 已集成真实 API
│   │   │   ├── Settings.vue   ✅ 已集成真实 API
│   │   │   ├── Shares.vue
│   │   │   ├── Trash.vue
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   └── ...
│   │   ├── App.vue
│   │   └── main.js
│   └── index.html
│
└── docs/                  # 技术文档
```

## 项目完成度

**当前进度**: 约 95% 🎉

### 已完成功能
- ✅ 项目基础架构（Vue 3 + Vite + Pinia）
- ✅ 登录/注册页面 UI
- ✅ **文件管理核心功能（Dashboard，95%）** - 完全集成真实 API
- ✅ **用户设置页面（Settings，95%）** - 完全集成真实 API
- ✅ **分享管理页面（Shares，95%）** - 完全集成真实 API
- ✅ **回收站页面（Trash，95%）** - 完全集成真实 API
- ✅ **管理员仪表板（AdminDashboard，95%）** - 完全集成真实 API
- ✅ **用户管理页面（Users，95%）** - 完全集成真实 API
- ✅ **审计日志页面（AuditLogs，95%）** - 完全集成真实 API
- ✅ AppLayout 用户菜单和布局
- ✅ 通用组件库（12个组件）
- ✅ 面包屑导航组件（Breadcrumb）
- ✅ 分享弹窗组件（ShareDialog）
- ✅ 通知中心组件（NotificationCenter）
- ✅ 移动对话框组件（MoveDialog）
- ✅ 国际化系统（中英文，240+ 翻译键）
- ✅ API 客户端和接口定义
- ✅ 响应式布局
- ✅ **Auth store 持久化功能** - 刷新页面保持登录状态
- ✅ **所有关键 Bug 修复**
- ✅ **Shares store 新建** - 完整分享状态管理
- ✅ **Trash store 新建** - 完整回收站状态管理
- ✅ **Admin store 新建** - 管理员功能状态管理

### 待开发功能
- ❌ 通知系统（后端 API 支持）
- ❌ 高级文件功能

历史开发计划请查看: [ARCHIVE_DEVELOPMENT_PLAN.md](./ARCHIVE_DEVELOPMENT_PLAN.md)

## 文档

- [API 文档](./API.md) - 完整的 API 接口文档
- [数据库设计](./DATABASE.md) - 数据库 schema 设计
- [开发指南](./DEVELOPMENT.md) - 开发规范
- [部署文档](./DEPLOYMENT.md) - 部署指南
- [修复日志](./BUGFIX.md) - 问题修复记录

## 安全说明

本项目采用多层安全措施保护用户数据：
- 密码使用 bcrypt 加密
- 文件使用 AES-256-CBC 加密
- JWT Token 认证
- 审计日志记录

## 许可证

MIT License

---

**版本**: v3.8  
**更新日期**: 2026-06-04  
**更新内容**: 
- 更新项目完成度至 95% 🎉
- 完成文件冲突对话框功能（FileConflictDialog组件）
- 完成双因素认证开关逻辑修复
- 完成文件冲突跳过处理异常修复
- 完成已存在文件type类型显示错误修复
- 完成创建文件夹同名冲突处理逻辑
- 完成移动文件夹同名冲突处理逻辑
- 完成头像API路径统一修复（沙箱环境头像显示问题）
- 完成头像上传后未更新显示问题修复
- 新增测试与优化文档和功能验证文档链接
