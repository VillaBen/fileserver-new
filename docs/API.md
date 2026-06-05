
# API 文档

## 概述

**Base URL**: `http://localhost:3000/api`

**认证方式**:
- JWT Token (通过 Cookie 或 Authorization Header)
- Cookie: `token`
- Header: `Authorization: Bearer &lt;token&gt;`

---

## 统一响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

---

## 认证接口

### POST /api/auth/register - 用户注册

**请求参数**:

```json
{
  "username": "用户名",
  "password": "密码",
  "email": "邮箱（可选）"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "role": "user",
    "status": 1,
    "created_at": "2024-01-01 00:00:00"
  },
  "message": "注册成功"
}
```

---

### POST /api/auth/login - 用户登录

**请求参数**:

```json
{
  "username": "用户名",
  "password": "密码",
  "captchaId": "验证码ID（可选）",
  "captchaCode": "验证码（可选）"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "role": "user",
    "status": 1,
    "storageQuota": 10737418240,
    "avatar": null,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01 00:00:00",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

**注意**: Token 会同时设置在响应 Cookie 中 (`token`)

---

### POST /api/auth/logout - 用户登出

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "data": null,
  "message": "登出成功"
}
```

---

### GET /api/auth/me - 获取当前用户信息

**需要认证**: ✅

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "role": "user",
    "status": 1,
    "storageQuota": 10737418240,
    "storageUsed": 0,
    "avatar": null,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01 00:00:00"
  }
}
```

---

### POST /api/auth/change-password - 修改密码

**需要认证**: ✅

**请求参数**:

```json
{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

---

### POST /api/auth/forgot-password - 忘记密码

**请求参数**:

```json
{
  "email": "邮箱"
}
```

---

### POST /api/auth/reset-password - 重置密码

**请求参数**:

```json
{
  "token": "重置令牌",
  "newPassword": "新密码"
}
```

---

### POST /api/auth/2fa/setup - 设置双因素认证

**需要认证**: ✅

---

### POST /api/auth/2fa/verify - 验证双因素认证

**需要认证**: ✅

**请求参数**:

```json
{
  "code": "验证码"
}
```

---

### POST /api/auth/2fa/disable - 禁用双因素认证

**需要认证**: ✅

---

### POST /api/auth/2fa/recovery-codes - 生成新的恢复码

**需要认证**: ✅

---

### POST /api/auth/send-email-code - 发送邮箱验证码

**请求参数**:

```json
{
  "email": "邮箱",
  "purpose": "用途 (如 'verification', 'reset_password')"
}
```

---

### POST /api/auth/verify-email-code - 验证邮箱验证码

**请求参数**:

```json
{
  "email": "邮箱",
  "purpose": "用途",
  "code": "验证码"
}
```

---

## 文件接口

### GET /api/files - 获取文件列表

**需要认证**: ✅

**查询参数**:

- `folderId`: 文件夹ID（可选，null 表示根目录）
- `inTrash`: 是否在回收站（0 或 1，默认 0）

**响应**:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 1,
        "originalName": "文件名.txt",
        "filename": "服务器文件名.txt.enc",
        "filepath": "/uploads/xxx.txt.enc",
        "size": 1024,
        "mimeType": "text/plain",
        "folderId": null,
        "inTrash": 0,
        "isEncrypted": 1,
        "fileHash": "sha256 hash",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
}
```

---

### POST /api/files/upload - 上传文件

**需要认证**: ✅

**请求格式**: `multipart/form-data`

**字段**:

- `files`: 文件列表
- `folderId`: 目标文件夹ID（可选）

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "originalName": "文件名.txt",
      "filename": "服务器文件名.txt",
      "size": 1024,
      "mimeType": "text/plain",
      "isEncrypted": true,
      "fileHash": "sha256 hash"
    }
  ],
  "message": "文件上传成功并已加密"
}
```

---

### GET /api/files/:id - 获取单个文件信息

**需要认证**: ✅

---

### GET /api/files/:id/download - 下载文件

**需要认证**: ✅

**响应**: 文件流（自动解密）

---

### DELETE /api/files/:id - 删除文件（移到回收站）

**需要认证**: ✅

---

### POST /api/files/:id/restore - 恢复文件

**需要认证**: ✅

---

### DELETE /api/files/:id/permanently - 永久删除文件

**需要认证**: ✅

---

### POST /api/files/empty-trash - 清空回收站

**需要认证**: ✅

---

### GET /api/files/search - 搜索文件

**需要认证**: ✅

**查询参数**:

- `query`: 搜索关键词

---

### PUT /api/files/:id/rename - 重命名文件

**需要认证**: ✅

**请求参数**:

```json
{
  "newName": "新文件名.txt"
}
```

---

## 用户接口

### GET /api/user/profile - 获取用户资料

**需要认证**: ✅

---

### PUT /api/user/profile - 更新用户资料

**需要认证**: ✅

---

### GET /api/user/storage - 获取存储信息

**需要认证**: ✅

---

### POST /api/user/avatar - 上传头像

**需要认证**: ✅

**请求格式**: `multipart/form-data`

---

### DELETE /api/user/avatar - 删除头像

**需要认证**: ✅

---

### POST /api/user/security-question - 设置安全问题

**需要认证**: ✅

---

### POST /api/user/verify-security-question - 验证安全问题

**需要认证**: ✅

---

## 分享接口

### GET /api/shares - 获取我的分享

**需要认证**: ✅

---

### POST /api/shares/files/:fileId - 创建分享

**需要认证**: ✅

**请求参数**:

```json
{
  "expiresIn": 3600,
  "maxDownloads": 10,
  "password": "密码（可选）"
}
```

---

### PUT /api/shares/:id - 更新分享

**需要认证**: ✅

---

### DELETE /api/shares/:id - 删除分享

**需要认证**: ✅

---

### GET /api/shares/public/:code - 获取分享信息（公开接口）

---

### POST /api/shares/public/:code/download - 下载分享文件（公开接口）

**请求参数**:

```json
{
  "password": "密码（如果有密码保护）"
}
```

---

## 管理员接口

### GET /api/admin/dashboard - 获取仪表盘统计

**需要认证**: ✅
**需要管理员权限**: ✅

---

### GET /api/admin/users - 获取用户列表

**需要认证**: ✅
**需要管理员权限**: ✅

---

### GET /api/admin/users/:accountId - 获取用户详情

**需要认证**: ✅
**需要管理员权限**: ✅

---

### PUT /api/admin/users/:accountId/role - 更新用户角色

**需要认证**: ✅
**需要管理员权限**: ✅

**请求参数**:

```json
{
  "role": "user"
}
```

---

### PUT /api/admin/users/:accountId/status - 更新用户状态

**需要认证**: ✅
**需要管理员权限**: ✅

**请求参数**:

```json
{
  "status": 1
}
```

---

### PUT /api/admin/users/:accountId/quota - 更新用户配额

**需要认证**: ✅
**需要管理员权限**: ✅

---

### DELETE /api/admin/users/:accountId - 删除用户

**需要认证**: ✅
**需要管理员权限**: ✅

---

### GET /api/admin/audit-logs - 获取审计日志

**需要认证**: ✅
**需要管理员权限**: ✅

**查询参数**:

- `accountId`: 账户ID（可选）
- `action`: 操作类型（可选）

---

### GET /api/admin/files - 获取所有文件

**需要认证**: ✅
**需要管理员权限**: ✅

---

## API Token 接口

### GET /api/tokens - 获取 API Token 列表

**需要认证**: ✅

---

### POST /api/tokens - 创建 API Token

**需要认证**: ✅

**请求参数**:

```json
{
  "name": "Token 名称",
  "permissions": ["read", "write"],
  "expiresInDays": 7
}
```

---

### DELETE /api/tokens/:id - 删除 API Token

**需要认证**: ✅

---

## 验证码接口

### GET /api/captcha/generate - 生成验证码

**响应**:

```json
{
  "success": true,
  "data": {
    "captchaId": "验证码ID",
    "image": "data:image/svg+xml;base64,..."
  }
}
```

---

### POST /api/captcha/verify - 验证验证码

**请求参数**:

```json
{
  "captchaId": "验证码ID",
  "captchaCode": "验证码"
}
```

---

## 公共接口

### GET /api/health - 健康检查

**响应**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 错误代码

| 错误代码 | 说明 |
|---------|------|
| VALIDATION_ERROR | 参数验证错误 |
| USERNAME_EXISTS | 用户名已存在 |
| INVALID_CREDENTIALS | 用户名或密码错误 |
| ACCOUNT_DISABLED | 账户已被禁用 |
| ACCOUNT_LOCKED | 账户已被锁定 |
| USER_NOT_FOUND | 用户不存在 |
| FILE_NOT_FOUND | 文件不存在 |
| UNAUTHORIZED | 未授权 |
| INTERNAL_ERROR | 服务器内部错误 |

