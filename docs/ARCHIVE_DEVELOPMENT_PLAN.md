# FileCloud 项目功能开发计划

&gt; **项目名称**: FileCloud - 文件管理系统  
&gt; **技术栈**: Vue 3 + Vite + Pinia + Vue Router + Element Plus + i18n  
&gt; **项目目录**: `/workspace/fileserver-new/frontend`  
&gt; **创建时间**: 2026-06-02  
&gt; **最后更新时间**: 2026-06-04  
&gt; **当前完成度**: **约 95%** ✅
&gt; **文档版本**: v11.0 (功能实现后更新)

---

## 一、项目当前状态概述

### 1.1 已完成的基础设施 ✅

| 类别 | 内容 | 完成度 |
|------|------|--------|
| **项目架构** | Vue 3 + Vite + Pinia + Vue Router | 100% |
| **UI 框架** | Element Plus 集成、响应式布局 | 90% |
| **国际化** | 中英文 i18n 系统（完成 240+ 翻译键） | 100% |
| **API 客户端** | Axios 封装、CSRF Token 拦截器、错误处理 | 100% |
| **API 接口定义** | auth, user, files, shares, admin, captcha, common | 100% |
| **工具函数** | format.js（文件大小/日期）, device.js（设备检测）, toast.js | 100% |
| **通用组件** | Captcha, PasswordStrength, LanguageSelector, TwoFactorSetup, EmptyState, FileCard, LoadingSpinner, ConfirmDialog, Breadcrumb, ShareDialog, NotificationCenter, MoveDialog | 100% |

### 1.2 完成的页面框架

| 页面 | 文件路径 | 框架完成度 | 功能完成度 | 状态 |
|------|---------|-----------|-----------|------|
| 着陆页 | `src/views/Landing.vue` | 100% | 100% | ✅ |
| 登录页 | `src/views/Login.vue` | 100% | 100% | ✅ 真实 API 集成 |
| 注册页 | `src/views/Register.vue` | 100% | 100% | ✅ 真实 API 集成 |
| 忘记密码页 | `src/views/ForgotPassword.vue` | 100% | 100% | ✅ 真实 API 集成 |
| 重置密码页 | `src/views/ResetPassword.vue` | 100% | 100% | ✅ 真实 API 集成 |
| **文件管理页** | `src/views/Dashboard.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| **分享管理页** | `src/views/Shares.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| **回收站页** | `src/views/Trash.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| **设置页** | `src/views/Settings.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| **管理员仪表板** | `src/views/Admin/AdminDashboard.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| **用户管理页** | `src/views/Admin/Users.vue` | **100%** | **95%** | **✅ 真实 API 集成** |
| 审计日志页 | `src/views/Admin/AuditLogs.vue` | 100% | 95% | ✅ 真实 API 集成 |

---

## 二、待实现功能详细列表

### 🔴 第一阶段：核心功能（P0 - 必须完成）

#### 2.1 Dashboard - 文件管理
**文件**: `src/views/Dashboard.vue`  
**Store**: `src/stores/files.js`

| 任务编号 | 功能 | 优先级 | 状态 | 备注 |
|---------|------|--------|------|------|
| D1 | 文件/文件夹列表展示（网格视图） | P0 | ✅ | 完整实现 |
| D2 | 文件/文件夹列表展示（列表视图） | P0 | ✅ | 完整实现 |
| D3 | 文件上传功能（实现 + 进度条） | P0 | ✅ 真实 API 集成 | 完整实现 |
| D4 | 拖放上传支持 | P0 | ✅ 真实 API 集成 | 完整实现 |
| D5 | 文件夹创建功能 | P0 | ✅ 真实 API 集成 | 完整实现 |
| D6 | 文件/文件夹删除（移至回收站） | P0 | ✅ 真实 API 集成 | 完整实现 |
| D7 | 文件下载功能 | P0 | ✅ 真实 API 集成 | 完整实现 |
| D8 | 文件预览功能（图片/PDF） | P0 | ✅ 真实 API 集成 | 完整实现预览对话框，支持图片/PDF预览 |
| D9 | 文件重命名功能 | P0 | ✅ 真实 API 集成 | 完整实现 |
| D10 | 文件移动功能 | P1 | ✅ 真实 API 集成 | 完整实现 |
| D11 | 文件搜索功能 | P0 | ✅ | 完整实现 |
| D12 | 面包屑导航 | P0 | ✅ | 完整实现 |
| D13 | 视图模式切换（网格/列表） | P1 | ✅ | 完整实现 |
| D14 | 实时统计（从 API 加载） | P0 | ✅ 真实 API 集成 | 完整实现，使用/files/stats API |
| D15 | 多选与批量操作 | P1 | ✅ UI | 完整实现 |
| D16 | 文件排序（名称/大小/日期） | P1 | ✅ | 完整实现 |
| D17 | 文件类型筛选 | P2 | ⚠️ 部分实现 | UI有但可能不完整 |

#### 2.2 认证流程完善
**文件**: `src/views/Login.vue`, `src/views/Register.vue`, `src/views/ForgotPassword.vue`, `src/views/ResetPassword.vue`  
**Store**: `src/stores/auth.js`

| 任务编号 | 功能 | 优先级 | 状态 | 备注 |
|---------|------|--------|------|------|
| A1 | 登录功能与后端 API 联调 | P0 | ✅ 真实 API 集成 | 完整实现 |
| A2 | 注册功能与后端 API 联调 | P0 | ✅ 真实 API 集成 | 完整实现 |
| A3 | 2FA 登录流程完善 | P0 | ✅ 真实 API 集成 | 完整实现 |
| A4 | 忘记密码功能实现（调用 API） | P0 | ✅ 真实 API 集成 | 完整实现 |
| A5 | 密码重置流程 | P0 | ✅ 真实 API 集成 | 完整实现 |
| A6 | 验证码验证流程 | P0 | ✅ 真实 API 集成 | 完整实现 |
| A7 | 错误处理与友好提示 | P0 | ✅ | 完整实现 |
| A8 | 登录后跳转到原始目标页 | P1 | ❌ | 未实现 |
| A9 | 自动登录（记住我） | P2 | ❌ | 未实现 |

#### 2.3 Settings 页面 - 用户设置
**文件**: `src/views/Settings.vue`

| 任务编号 | 功能 | 优先级 | 状态 | 备注 |
|---------|------|--------|------|------|
| S1 | 加载当前用户资料 | P0 | ✅ 真实 API 集成 | 完整实现 |
| S2 | 修改显示名称 | P0 | ✅ 真实 API 集成 | 完整实现 |
| S3 | 修改邮箱 | P0 | ⚠️ UI禁用 | 邮箱字段disabled，可能不支持修改 |
| S4 | 上传头像 | P0 | ✅ 真实 API 集成 | 完整实现 |
| S5 | 删除头像 | P0 | ✅ 真实 API 集成 | 完整实现 |
| S6 | 修改密码（API 联调） | P0 | ✅ 真实 API 集成 | 完整实现 |
| S7 | 启用/禁用 2FA | P0 | ✅ 真实 API 集成 | 完整实现2FA设置UI，包含设置向导和恢复码 |
| S8 | 主题切换（亮/暗/系统） | P1 | ✅ 真实 API 集成 | 完整实现（light/dark/system） |
| S9 | 语言切换（设置页面内） | P1 | ✅ 真实 API 集成 | 完整实现 |
| S10 | 存储空间显示（真实数据） | P0 | ✅ 真实 API 集成 | 完整实现，显示使用量/总量/百分比 |
| S11 | 通知设置 | P2 | ❌ 未实现 |
| S12 | 会话管理（活跃设备） | P2 | ❌ 未实现 |

---

### 🟡 第二阶段：重要功能（P1 - 应该完成）

#### 2.4 Shares 页面 - 分享管理
**文件**: `src/views/Shares.vue`  
**Store**: `src/stores/shares.js` ✅

| 任务编号 | 功能 | 优先级 | 状态 | 备注 |
|---------|------|--------|------|------|
| SH1 | 我的分享列表展示 | P1 | ✅ 真实 API 集成 | 完整实现 |
| SH2 | 创建分享链接 | P1 | ✅ 真实 API 集成 | 完整实现（ShareDialog） |
| SH3 | 分享链接设置（过期/密码/权限） | P1 | ✅ 真实 API 集成 | 完整实现（updateShare） |
| SH4 | 复制分享链接 | P1 | ✅ 真实 API 集成 | 完整实现 |
| SH5 | 编辑分享 | P1 | ✅ 真实 API 集成 | 完整实现 |
| SH6 | 删除分享 | P1 | ✅ 真实 API 集成 | 完整实现 |
| SH7 | 分享统计（查看/下载次数） | P1 | ⚠️ 部分实现 | UI可能有，但不确定是否显示统计 |
| SH8 | 公开分享页面（无需登录访问） | P1 | ❌ 未实现 | 没有公开分享页面 |
| SH9 | 分享给我（他人分享给我的） | P1 | ❌ 未实现 | 没有此功能 |

#### 2.5 Trash 页面 - 回收站
**文件**: `src/views/Trash.vue`  
**Store**: `src/stores/trash.js` ✅

| 任务编号 | 功能 | 优先级 | 状态 | 备注 |
|---------|------|--------|------|------|
| T1 | 回收站文件列表 | P1 | ✅ 真实 API 集成 | 完整实现 |
| T2 | 恢复文件 | P1 | ✅ 真实 API 集成 | 完整实现 |
| T3 | 永久删除文件 | P1 | ✅ 真实 API 集成 | 完整实现 |
| T4 | 清空回收站 | P1 | ✅ 真实 API 集成 | 完整实现 |
| T5 | 批量操作 | P2 | ❌ 未实现 | Trash.vue没有批量操作功能 |
| T6 | 自动清空过期文件（前端提示） | P2 | ⚠️ 部分实现 | 可能没有实现过期提示 |

#### 2.6 AppLayout 组件完善
**文件**: `src/components/AppLayout.vue`

| 任务编号 | 功能 | 优先级 | 状态 |
|---------|------|--------|------|
| AL1 | 真实存储空间显示（从 API） | P0 | ✅ 真实 API 集成 | 使用userAPI.getStorage()获取真实数据 |
| AL2 | 通知中心（下拉列表） | P1 | ⚠️ Mock数据 | NotificationCenter使用mock数据（待后端API） |
| AL3 | 用户菜单下拉（个人资料/设置/登出） | P0 | ✅ | |
| AL4 | 全局搜索（跨页搜索） | P2 | ✅ 已实现 | 搜索框跳转到Dashboard并传递搜索参数 |
| AL5 | 消息中心/通知页面 | P2 | ❌ |
| AL6 | 移动端汉堡菜单 | P0 | ✅ UI |
| AL7 | 面包屑导航 | P1 | ✅ |

---

### 🟢 第三阶段：增强功能（P2 - 锦上添花）

#### 2.7 管理员功能
**文件**: `src/views/Admin/*.vue`

| 任务编号 | 功能 | 优先级 | 状态 |
|---------|------|--------|------|
| ADM1 | 管理员仪表板真实数据 | P1 | ✅ 真实 API 集成 |
| ADM2 | 用户列表（真实数据 + 分页） | P1 | ✅ 真实 API 集成 |
| ADM3 | 用户搜索/筛选 | P1 | ✅ 真实 API 集成 |
| ADM4 | 编辑用户资料 | P1 | ✅ 真实 API 集成 |
| ADM5 | 修改用户角色 | P1 | ✅ 真实 API 集成 |
| ADM6 | 启用/禁用用户 | P1 | ✅ 真实 API 集成 |
| ADM7 | 修改用户配额 | P1 | ✅ 真实 API 集成 |
| ADM8 | 删除用户 | P1 | ✅ 真实 API 集成 |
| ADM9 | 审计日志列表（真实数据） | P2 | ✅ 真实 API 集成 | 完整实现，包含分页功能 |
| ADM10 | 审计日志筛选（按用户/操作/时间） | P2 | ❌ |
| ADM11 | 系统统计图表 | P2 | ❌ |
| ADM12 | 系统设置（全局配置） | P3 | ❌ |

#### 2.8 高级文件功能

| 任务编号 | 功能 | 优先级 |
|---------|------|--------|
| AF1 | 文件版本历史 | P3 |
| AF2 | 文件评论/协作 | P3 |
| AF3 | 在线文档编辑 | P3 |
| AF4 | 文件标签 | P2 |
| AF5 | 文件收藏 | P2 |
| AF6 | 智能搜索（全文/OCR） | P3 |
| AF7 | 重复文件检测 | P3 |
| AF8 | 文件加密（端到端） | P3 |
| AF9 | 断点续传 | P2 |
| AF10 | 大文件分片上传 | P2 |

---

## 三、技术债务与代码质量改进

### 3.1 错误处理与用户反馈

| 任务编号 | 改进项 | 文件 | 优先级 |
|---------|--------|------|--------|
| Q1 | 统一使用 `toast` 工具替代 `ElMessage` | 所有 .vue 文件 | ✅ 已完成 |
| Q2 | 全局错误处理（Vue errorHandler） | `main.js` | ✅ 已完成 | 实现errorHandler和warnHandler |
| Q3 | API 错误统一拦截（401 跳转登录） | `api/client.js` | ✅ 已完成 | 处理401/403/404/500等错误 |
| Q4 | 加载状态统一管理 | 全局 | P1 |
| Q5 | 空状态组件复用 | 已完成 `EmptyState.vue` | ✅ 已完成 |
| Q6 | 错误边界组件 | 已完成 `ConfirmDialog.vue` | ✅ 已完成 |

### 3.2 性能优化

| 任务编号 | 改进项 | 优先级 |
|---------|--------|--------|
| PF1 | 路由懒加载（已实现） | ✅ |
| PF2 | 组件懒加载 | P1 |
| PF3 | 大列表虚拟滚动 | P1 |
| PF4 | 图片懒加载 | P1 |
| PF5 | API 请求防抖/节流 | P1 |
| PF6 | 缓存策略（Pinia 持久化） | P2 |
| PF7 | Bundle 体积分析 | P2 |

### 3.3 可维护性

| 任务编号 | 改进项 | 优先级 |
|---------|--------|--------|
| M1 | 抽取通用组件（FileItem、FolderItem、Modal） | ✅ 部分完成 |
| M2 | 抽取 composables（useFile、useShare、useTrash） | P1 |
| M3 | 完善 TypeScript 类型定义 | P2 |
| M4 | 添加单元测试 | P2 |
| M5 | 添加 E2E 测试（已有 Playwright） | ✅ 部分完成 |
| M6 | 完善代码注释 | P2 |
| M7 | 引入 ESLint + Prettier 规范化 | P2 |

---

## 四、待新建的 Stores

| Store 名 | 文件路径 | 用途 | 优先级 |
|---------|---------|------|--------|
| ~~`useSharesStore`~~ | ~~`src/stores/shares.js`~~ | 分享管理状态 | ✅ 已完成 |
| ~~`useTrashStore`~~ | ~~`src/stores/trash.js`~~ | 回收站状态 | ✅ 已完成 |
| `useSettingsStore` | `src/stores/settings.js` | 用户设置状态 | P1 |
| `useNotificationStore` | `src/stores/notification.js` | 通知状态 | P2 |
| ~~`useAdminStore`~~ | ~~`src/stores/admin.js`~~ | 管理员功能状态 | ✅ 已完成 |
| `useThemeStore` | `src/stores/theme.js` | 主题状态 | P1 |

---

## 五、开发计划时间线

### ✅ Sprint 1: 核心文件管理（已完成）
- ✅ 任务 D1-D9: 文件/文件夹核心 CRUD
- ✅ 任务 D11-D14: 搜索、面包屑、统计
- ✅ 任务 AL1, AL6: 布局完善
- ✅ 任务 M1, Q1, Q5, Q6: 错误处理和组件抽取

### ✅ Sprint 2: 用户与认证（已完成）
- ✅ 任务 A1-A7: 认证流程完善（真实 API 集成）
- ✅ 任务 S1-S7, S10: Settings 页面核心
- ✅ 任务 AL3: 用户菜单
- ✅ 任务 SH1-SH7: 分享管理页面
- ✅ 任务 T1-T4: 回收站功能

### ✅ Sprint 3: 管理员与优化（已完成）
- ✅ 任务 D12: 面包屑导航（已完成）
- ✅ 任务 AL7: AppLayout 面包屑组件（已完成）
- ✅ 任务 D16: 文件排序（已完成）
- ✅ ShareDialog.vue: 分享弹窗组件（已完成）
- ✅ 任务 AL2: 通知中心（已完成 - UI部分）
- ✅ NotificationCenter.vue: 通知中心组件（已完成）
- ✅ MoveDialog.vue: 移动对话框组件（已完成）
- ✅ 任务 D10: 文件移动功能（已完成）
- ✅ 任务 ADM1-ADM9: 管理员核心（已完成）
- ✅ 任务 D8: 文件预览功能（已完成）
- ✅ 任务 D14: 实时统计（已完成）
- ✅ 任务 S7: 2FA设置UI（已完成）
- ✅ 任务 S10: 存储空间显示（已完成）
- ✅ 任务 AL1: 真实存储空间（已完成）
- ✅ 任务 AL4: 快速搜索（已完成）
- ✅ 任务 Q2: 全局错误处理（已完成）
- ✅ 任务 Q3: API错误拦截（已完成）
- 任务 Q4: 加载状态统一管理
- 任务 M2-M3: 组件抽取
- 任务 ADM10-ADM12: 审计日志增强
- 任务 SH8-SH9: 分享增强
- 任务 S11-S12: Settings 增强
- 任务 AL5: 消息中心/通知页面
- 任务 D15, D17: Dashboard 增强

### 📋 Sprint 4: 高级功能与打磨（持续）
- 通知系统完善
- 高级文件功能
- 性能优化
- 测试覆盖

---

## 六、核心文件清单

### 核心文件 ✅
- [main.js](file:///workspace/fileserver-new/frontend/src/main.js)
- [App.vue](file:///workspace/fileserver-new/frontend/src/App.vue)
- [router/index.js](file:///workspace/fileserver-new/frontend/src/router/index.js)

### 视图文件
- [Dashboard.vue](file:///workspace/fileserver-new/frontend/src/views/Dashboard.vue) ✅ 已完善（95%）
- [Settings.vue](file:///workspace/fileserver-new/frontend/src/views/Settings.vue) ✅ 已完善（95%）
- [Shares.vue](file:///workspace/fileserver-new/frontend/src/views/Shares.vue) ✅ 已完善（95%）
- [Trash.vue](file:///workspace/fileserver-new/frontend/src/views/Trash.vue) ✅ 已完善（95%）
- [Login.vue](file:///workspace/fileserver-new/frontend/src/views/Login.vue) ✅
- [Register.vue](file:///workspace/fileserver-new/frontend/src/views/Register.vue) ✅
- [ForgotPassword.vue](file:///workspace/fileserver-new/frontend/src/views/ForgotPassword.vue) ✅
- [ResetPassword.vue](file:///workspace/fileserver-new/frontend/src/views/ResetPassword.vue) ✅
- [Landing.vue](file:///workspace/fileserver-new/frontend/src/views/Landing.vue) ✅
- [Admin/AdminDashboard.vue](file:///workspace/fileserver-new/frontend/src/views/Admin/AdminDashboard.vue) ✅
- [Admin/Users.vue](file:///workspace/fileserver-new/frontend/src/views/Admin/Users.vue) ✅
- [Admin/AuditLogs.vue](file:///workspace/fileserver-new/frontend/src/views/Admin/AuditLogs.vue)
- [Admin/AdminLayout.vue](file:///workspace/fileserver-new/frontend/src/views/Admin/AdminLayout.vue) ✅

### Store 文件
- [auth.js](file:///workspace/fileserver-new/frontend/src/stores/auth.js) ✅
- [files.js](file:///workspace/fileserver-new/frontend/src/stores/files.js) ✅
- [i18n.js](file:///workspace/fileserver-new/frontend/src/stores/i18n.js) ✅
- [shares.js](file:///workspace/fileserver-new/frontend/src/stores/shares.js) ✅
- [trash.js](file:///workspace/fileserver-new/frontend/src/stores/trash.js) ✅
- [admin.js](file:///workspace/fileserver-new/frontend/src/stores/admin.js) ✅

### 组件文件 ✅
- [AppLayout.vue](file:///workspace/fileserver-new/frontend/src/components/AppLayout.vue)
- [Captcha.vue](file:///workspace/fileserver-new/frontend/src/components/Captcha.vue) ✅
- [PasswordStrength.vue](file:///workspace/fileserver-new/frontend/src/components/PasswordStrength.vue) ✅
- [LanguageSelector.vue](file:///workspace/fileserver-new/frontend/src/components/LanguageSelector.vue) ✅
- [TwoFactorSetup.vue](file:///workspace/fileserver-new/frontend/src/components/TwoFactorSetup.vue) ✅
- [EmptyState.vue](file:///workspace/fileserver-new/frontend/src/components/EmptyState.vue) ✅
- [FileCard.vue](file:///workspace/fileserver-new/frontend/src/components/FileCard.vue) ✅
- [LoadingSpinner.vue](file:///workspace/fileserver-new/frontend/src/components/LoadingSpinner.vue) ✅
- [ConfirmDialog.vue](file:///workspace/fileserver-new/frontend/src/components/ConfirmDialog.vue) ✅
- [Breadcrumb.vue](file:///workspace/fileserver-new/frontend/src/components/Breadcrumb.vue) ✅
- [ShareDialog.vue](file:///workspace/fileserver-new/frontend/src/components/ShareDialog.vue) ✅
- [NotificationCenter.vue](file:///workspace/fileserver-new/frontend/src/components/NotificationCenter.vue) ✅
- [MoveDialog.vue](file:///workspace/fileserver-new/frontend/src/components/MoveDialog.vue) ✅

### 工具文件
- [format.js](file:///workspace/fileserver-new/frontend/src/utils/format.js) ✅
- [device.js](file:///workspace/fileserver-new/frontend/src/utils/device.js)
- [toast.js](file:///workspace/fileserver-new/frontend/src/utils/toast.js)

### API 文件
- [client.js](file:///workspace/fileserver-new/frontend/src/api/client.js)
- [index.js](file:///workspace/fileserver-new/frontend/src/api/index.js)

---

## 七、文档版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| **v10.0** | 2026-06-02 | **代码验证完成**：逐一检查前后端代码，修正所有功能状态记录 |
| v9.0 | 2026-06-02 | 文档优化：删除大量重复内容，精简结构 |
| v8.0 | 2026-06-02 | 完成完整的API联调检查，全面修正所有任务状态 |
| v7.0-v5.0 | ... | 早期版本迭代历史 |

---

## 八、项目完成总结

### 当前项目完成度: **约 90-95%** ✅

**已就绪**:
- ✅ 项目架构、路由、状态管理
- ✅ API 接口定义与客户端
- ✅ 主要页面 UI 框架
- ✅ 登录/注册/忘记密码/重置密码（完整真实 API 集成）
- ✅ **Dashboard 文件管理核心功能（95%，真实 API 集成）**
- ✅ **Settings 用户设置页面（95%，真实 API 集成）**
- ✅ **Shares 分享管理页面（95%，真实 API 集成）**
- ✅ **Trash 回收站页面（95%，真实 API 集成）**
- ✅ **AdminDashboard 管理员仪表板（95%，真实 API 集成）**
- ✅ **Users 用户管理页面（95%，真实 API 集成）**
- ✅ **通用组件库（12 个组件）**
- ✅ **i18n 系统（240+ 翻译键）**
- ✅ **AppLayout 用户菜单和布局**
- ✅ **面包屑导航组件（Breadcrumb）**
- ✅ **Auth store 持久化功能**
- ✅ **所有核心 Stores 已完成**
- ✅ **文件移动功能（MoveDialog）**

**需要完善的功能**:
- ⚠️ 审计日志（AuditLogs）UI完善
- ❌ 通知系统完整实现
- ❌ 主题切换实际实现
- ❌ 全局搜索功能

---

**文档版本**: v10.1 (详细检查后更新)
**备份文档**: [DEVELOPMENT_PLAN.md.bak.20260603](file:///workspace/fileserver-new/docs/DEVELOPMENT_PLAN.md.bak.20260603)
**优化前文档长度**: ~734行
**优化后文档长度**: ~470行
**减少内容**: ~264行 (~36%)

---

## 📋 详细检查问题汇总（2026-06-04）

### ✅ 已解决的高优先级问题

| 编号 | 功能 | 原问题描述 | 解决方案 | 状态 |
|-----|------|---------|---------|------|
| P1 | D8 文件预览 | handlePreview只有toast提示 | 实现完整预览对话框，支持图片/PDF预览 | ✅ 已解决 |
| P2 | D14 实时统计 | 使用本地files数组计算 | 添加/files/stats API，使用真实数据 | ✅ 已解决 |
| P3 | S7 2FA设置 | Settings.vue缺少UI入口 | 添加完整2FA设置UI，包含设置向导和恢复码 | ✅ 已解决 |
| P4 | S10 存储空间 | Settings.vue没有存储空间显示 | 添加存储空间卡片，显示使用量/总量/百分比 | ✅ 已解决 |
| P5 | AL1 存储空间 | AppLayout使用固定值 | 使用userAPI.getStorage()获取真实数据 | ✅ 已解决 |
| P7 | AL4 快速搜索 | 无真实搜索API调用 | 实现搜索跳转到Dashboard并传递参数 | ✅ 已解决 |
| P8 | ADM9 审计日志 | AuditLogs.vue使用mock数据 | 重写组件，使用adminStore.loadAuditLogs() | ✅ 已解决 |

### ⚠️ 待解决的问题

| 编号 | 功能 | 问题描述 | 优先级 |
|-----|------|---------|--------|
| P6 | AL2 通知中心 | 使用mock数据，需后端通知API支持 | 中（需后端配合） |
| M1 | ADM10 筛选 | 审计日志筛选功能未实现 | 中 |
| M2 | ADM11 图表 | 系统统计图表未实现 | 低 |
| M3 | ADM12 设置 | 系统设置功能未实现 | 低 |
| M4 | SH8 公开分享 | 公开分享页面未实现 | 中 |
| M5 | SH9 分享给我 | 他人分享给我的文件功能未实现 | 中 |
| M6 | T5/T6 批量操作 | Trash批量选择/操作功能缺失 | 中 |

### 低优先级问题（待新增功能）

| 编号 | 功能 | 优先级 |
|-----|------|--------|
| L1 | 复制/粘贴功能 | P1 |
| L2 | 拖拽上传 | P2 |
| L3 | 头像上传 | P1 |
| L4 | 会话管理（活跃设备） | P2 |
| L5 | 安全日志查看 | P2 |
| L6 | API密钥管理 | P3 |
| L7 | 快捷方式功能 | P2 |
| L8 | 文件版本历史 | P3 |
| L9 | 文件评论/协作 | P3 |
| L10 | 在线文档编辑 | P3 |
| L11 | 文件标签 | P2 |
| L12 | 文件收藏 | P2 |
| L13 | 断点续传 | P2 |
| L14 | 大文件分片上传 | P2 |
