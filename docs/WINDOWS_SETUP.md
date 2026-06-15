# FileCloud Windows 本地开发环境搭建指南

本指南将帮助你把项目从云端容器迁移到 Windows 本地开发环境，并解决 Windows 与 Linux 之间的路径和服务差异。

---

## 目录

1. [环境要求](#1-环境要求)
2. [项目代码获取](#2-项目代码获取)
3. [数据库配置](#3-数据库配置)
4. [病毒扫描配置](#4-病毒扫描配置)
5. [环境变量配置](#5-环境变量配置)
6. [依赖安装](#6-依赖安装)
7. [服务启动](#7-服务启动)
8. [常见问题排查](#8-常见问题排查)
9. [日常开发流程](#9-日常开发流程)

---

## 1. 环境要求

### 必需软件

| 软件 | 版本要求 | 说明 | 下载地址 |
|------|---------|------|---------|
| **Node.js** | >= 18.0.0 | 项目运行环境 | https://nodejs.org/ |
| **Git** | 任意 | 代码版本管理 | https://git-scm.com/download/win |

### 可选软件（根据配置选择）

| 软件 | 说明 | 下载地址 |
|------|------|---------|
| **MySQL 8.0+** | 数据库（可选，默认使用 SQLite） | https://dev.mysql.com/downloads/mysql/ |
| **XAMPP / WAMP** | 集成环境（推荐，包含 MySQL） | https://www.apachefriends.org/zh_cn/index.html |
| **ClamAV** | 病毒扫描引擎（可选，默认使用文件头检测） | https://www.clamav.net/downloads |

### 检查当前环境

打开 **PowerShell**（以管理员身份运行更好），执行以下命令检查：

```powershell
# 检查 Node.js
node --version    # 应输出 >= v18.x.x
npm --version     # 应输出 >= 9.x.x

# 检查 Git
git --version     # 应输出任意版本
```

**如果 Node.js 未安装**：
1. 访问 https://nodejs.org/
2. 下载 **LTS** 版本（推荐 18.x 或 20.x）
3. 安装时勾选 **"Automatically install the necessary tools"** 和 **"Add to PATH"**
4. 安装完成后重启 PowerShell

---

## 2. 项目代码获取

### 方式一：从 GitHub 克隆（推荐）

```powershell
# 进入你想放项目的目录，例如：
cd D:\Projects

# 克隆项目
git clone https://github.com/VillaBen/fileserver-new.git

# 进入项目目录
cd fileserver-new

# 切换到当前开发分支
git checkout trae/solo-agent-ZzGRHy

# 查看当前分支
git branch
```

### 方式二：直接复制项目文件夹

如果你有项目的压缩包或可以直接拷贝：
1. 将整个 `/workspace` 目录复制到 Windows 本地，例如 `D:\Projects\fileserver-new`
2. **重要**：删除以下目录（它们包含 Linux 环境的特定依赖）：
   ```
   backend\node_modules\
   frontend\node_modules\
   clamav-data\       # Linux 病毒库数据
   mysql-data\        # Linux MySQL 数据
   ```

### 项目结构说明

```
fileserver-new/
├── backend/              # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── config/       # 数据库、文件类型等配置
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件（认证、病毒扫描等）
│   │   ├── controllers/  # 业务逻辑
│   │   └── utils/        # 工具函数
│   ├── uploads/          # 文件上传目录（运行时创建）
│   ├── database/         # SQLite 数据库文件（运行时创建）
│   ├── server.js         # 服务入口
│   ├── package.json      # 后端依赖
│   └── .env              # 环境变量（需创建）
├── frontend/             # 前端应用（Vue 3 + Vite）
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   ├── stores/       # Pinia 状态管理
│   │   └── assets/       # 静态资源
│   ├── package.json      # 前端依赖
│   └── vite.config.js    # Vite 配置
├── docs/                 # 文档目录
├── start-all.ps1         # Windows 全服务启动脚本 ⭐
├── start-mysql.ps1       # MySQL 启动脚本
├── start-clamav.ps1      # ClamAV 启动脚本
├── start-all.sh          # Linux 启动脚本
└── README.md             # 项目说明
```

---

## 3. 数据库配置

项目支持 **两种数据库**，你可以二选一：

### 🅰️ 方案一：SQLite（推荐，Windows 零配置）⭐

**最简单！无需安装任何东西！** Node.js 的 `sqlite3` 模块会自动处理。

**优势**：
- 零配置，无需安装额外软件
- 数据库就是一个文件 (`backend/database/fileserver.db`)
- Windows 文件路径自动适配

**配置**：
在 `backend/.env` 中设置：
```env
# 使用 SQLite（默认）
DB_TYPE=sqlite
```

项目启动时会自动创建数据库文件和表结构。

---

### 🅱️ 方案二：MySQL（需要安装）

如果你想使用 MySQL（和云端环境一致）：

#### 步骤 1：安装 MySQL

**推荐使用 XAMPP**（最简单）：
1. 下载 XAMPP：https://www.apachefriends.org/zh_cn/index.html
2. 安装时勾选 **MySQL**（不需要 Apache、PHP、FileZilla、Mercury、Tomcat）
3. 安装完成后打开 **XAMPP Control Panel**
4. 启动 **MySQL** 服务

**或安装官方 MySQL**：
1. 下载 MySQL Community Server：https://dev.mysql.com/downloads/mysql/
2. 安装时设置 root 密码（建议设为 `root` 或空）
3. 确保 MySQL 服务在运行（Windows 服务中叫 `MySQL80` 或 `MySQL`）

#### 步骤 2：创建数据库

打开 **PowerShell** 或 **MySQL Command Line Client**：

```powershell
# 使用 XAMPP 的 mysql
cd "C:\xampp\mysql\bin"
.\mysql.exe -u root -p
# 输入密码（XAMPP 默认是空密码）

# 或者如果已添加到 PATH，直接：
mysql -u root -p
```

在 MySQL 中执行：
```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS fileserver
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 确认创建成功
SHOW DATABASES;

-- 退出
EXIT;
```

#### 步骤 3：在 `.env` 中配置

```env
# 使用 MySQL
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=fileserver
```

**注意 Windows 的路径差异**：
- Windows 上 MySQL 默认使用 **TCP 连接**（`127.0.0.1:3306`），不是 Unix socket
- Linux 使用 socket 文件 `/var/run/mysqld/mysqld.sock`
- 所以在 Windows 上**不需要**设置 `MYSQL_SOCKET`，让它自动使用 TCP

---

## 4. 病毒扫描配置

项目支持 **三种扫描模式**：

| 模式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| `file-header` | 仅检查文件头和扩展名 | 零配置，无需安装软件 | 检测能力相对有限 |
| `clamav` | 使用 ClamAV 引擎完整扫描 | 检测能力强 | 需要安装 ClamAV |
| `hybrid` | 先文件头检测，再 ClamAV 扫描 | 平衡安全性和性能 | 需要安装 ClamAV |

### 🅰️ 方案一：文件头检测（推荐，Windows 零配置）⭐

**最简单！** 直接在 `.env` 中设置：
```env
# 使用文件头检测（Windows 推荐）
MALWARE_SCAN_MODE=file-header
```

无需安装任何额外软件。

---

### 🅱️ 方案二：安装 ClamAV（完整病毒扫描）

如果你想使用完整的 ClamAV 扫描：

#### 步骤 1：下载并安装

1. 访问：https://www.clamav.net/downloads
2. 在 "**ClamAV for Windows**" 部分下载 **Win64** 版本的 `.msi` 安装包
3. 双击安装，默认安装到 `C:\Program Files\ClamAV\`

#### 步骤 2：创建配置文件

在 ClamAV 安装目录下（`C:\Program Files\ClamAV\`），有配置文件模板：
```
conf_examples\freshclam.conf.example
conf_examples\clamd.conf.example
```

复制并重命名为 `freshclam.conf` 和 `clamd.conf`，**删除第一行的 `Example`**。

#### 步骤 3：更新病毒库

以**管理员身份**打开 PowerShell：
```powershell
cd "C:\Program Files\ClamAV"
.\freshclam.exe
```

第一次运行会下载病毒库（可能需要几分钟）。

#### 步骤 4：启动 ClamAV 守护进程（可选）

如果你想使用 clamd TCP 模式（更快）：
```powershell
cd "C:\Program Files\ClamAV"
.\clamd.exe
```

Clamd 默认监听 `127.0.0.1:3310`。

#### 步骤 5：配置 `.env`

**使用命令行模式（推荐，无需后台进程）**：
```env
MALWARE_SCAN_MODE=clamav
# 使用 clamscan 命令行（Windows 推荐，无需配置 socket）
# 留空自动检测 clamdscan / clamscan
```

**或使用 TCP 模式（如果 clamd 在运行）**：
```env
MALWARE_SCAN_MODE=clamav
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
```

**注意 Windows 的路径差异**：
- Linux 使用 Unix socket：`/var/run/clamav/clamd.ctl`
- Windows 使用 **TCP 连接**：`127.0.0.1:3310` 或直接调用 `clamscan.exe` 命令行
- **不要**在 Windows 上设置 `CLAMAV_SOCKET`

---

## 5. 环境变量配置

### 创建 `.env` 文件

在 `backend/` 目录下创建 `\.env` 文件：

```powershell
# 在 PowerShell 中执行
cd backend
notepad .env
```

### 推荐配置（Windows 版本）

```env
# ============================================
# FileCloud 后端配置（Windows 专用）
# ============================================

# -------- 数据库配置 --------
# 可选值: sqlite | mysql
# Windows 推荐使用 sqlite（零配置），无需安装 MySQL
DB_TYPE=sqlite

# MySQL 配置（DB_TYPE=mysql 时才需要）
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=fileserver
# Windows 上 MySQL 使用 TCP 连接，不要设置 MYSQL_SOCKET
# MYSQL_SOCKET=

# -------- 病毒扫描配置 --------
# 可选值: file-header | clamav | hybrid | virustotal | multi-scan | disabled
# Windows 推荐使用 file-header（零配置）或 clamav（需安装 ClamAV）
MALWARE_SCAN_MODE=file-header

# ClamAV 配置（MALWARE_SCAN_MODE=clamav/hybrid 时才需要）
# Windows 使用 TCP 连接或命令行，不要设置 CLAMAV_SOCKET
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=60000
CLAMAV_REMOVE_INFECTED=false
CLAMAV_QUARANTINE_INFECTED=false
CLAMAV_QUARANTINE_PATH=./quarantine

# 扫描失败时是否拒绝上传（严格模式）
BLOCK_ON_FAILURE=false

# -------- 服务端口配置 --------
# 后端服务端口
PORT=3000

# 允许的前端来源（CORS）
# 本地开发时 Vite 默认使用 5173
CORS_ORIGIN=http://localhost:5173

# -------- 安全配置 --------
# JWT 密钥（生成随机字符串，建议修改）
JWT_SECRET=your_jwt_secret_key_change_this_to_a_long_random_string

# 加密密钥（文件内容加密密钥）
ENCRYPTION_KEY=your_encryption_key_change_this_to_at_least_32_characters

# CSRF 密钥
CSRF_SECRET=your_csrf_secret_change_this

# Token 有效期（毫秒），4 小时
TOKEN_TTL=14400000

# -------- 文件上传配置 --------
# 单个文件最大大小（字节），100MB
MAX_FILE_SIZE=104857600

# 文件存储路径（相对或绝对路径）
# Windows 使用反斜杠或正斜杠均可，Node.js 会自动处理
UPLOAD_PATH=./uploads
CACHE_PATH=./cache

# -------- 邮件配置（可选） --------
# 如需使用注册验证和密码重置，请配置 SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# SMTP_FROM=FileCloud <your_email@gmail.com>

# -------- 开发配置 --------
# 是否启用详细日志
LOG_LEVEL=info

# 开发模式（true 时显示详细错误信息）
NODE_ENV=development
```

**快速创建**：你可以直接复制上面的内容保存到 `backend\.env` 文件中。

---

## 6. 依赖安装

在两个目录中分别安装依赖。**Windows 上每次打开新的 PowerShell 都需要重新进入目录**。

### 步骤 1：安装后端依赖

```powershell
# 进入后端目录
cd D:\Projects\fileserver-new\backend

# 安装依赖（第一次可能需要 2-5 分钟）
npm install
```

**如果遇到 `node-gyp` 错误**（常见于 Windows 编译原生模块）：
```powershell
# 以管理员身份运行 PowerShell，安装 Windows Build Tools
npm install --global windows-build-tools

# 或者使用更简单的方式：
npm install --global --production windows-build-tools
```

`bcryptjs`、`sqlite3` 等模块需要编译，但通常预编译版本可用。

### 步骤 2：安装前端依赖

```powershell
# 新开一个 PowerShell 窗口
cd D:\Projects\fileserver-new\frontend

# 安装依赖（可能需要 3-10 分钟）
npm install
```

**如果安装速度慢**，可以使用国内镜像：
```powershell
# 临时使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或者永久设置
npm config set registry https://registry.npmmirror.com
```

---

## 7. 服务启动

### 方式一：使用 PowerShell 一键启动脚本（推荐）⭐

```powershell
# 进入项目根目录
cd D:\Projects\fileserver-new

# 运行全服务启动脚本
.\start-all.ps1
```

这个脚本会自动：
1. 检查并启动 MySQL（如果安装了）
2. 检查并启动 ClamAV（如果安装了）
3. 启动后端服务（端口 3000）
4. 启动前端服务（端口 5173）

### 方式二：手动启动（调试时更方便）

打开**两个 PowerShell 窗口**：

**窗口 1 - 后端服务**：
```powershell
cd D:\Projects\fileserver-new\backend
npm start
```

等待看到：
```
🗄️ 使用 SQLite 数据库
✅ 已连接到 SQLite 数据库
✅ 数据库表初始化完成
🚀 后端服务已启动
   地址: http://localhost:3000
   环境: development
```

**窗口 2 - 前端服务**：
```powershell
cd D:\Projects\fileserver-new\frontend
npm run dev
```

等待看到：
```
VITE v5.4.21  ready in 2345 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 步骤 3：访问应用

打开浏览器访问：
- **前端应用**：http://localhost:5173/
- **后端 API**：http://localhost:3000/api/health

第一次访问时需要：
1. 注册账号（用户名、邮箱、密码）
2. 登录
3. 开始使用

---

## 8. 常见问题排查

### ❌ 问题 1：`npm install` 失败，提示权限错误

**原因**：Windows 文件系统权限或防病毒软件锁定文件。

**解决**：
```powershell
# 以管理员身份运行 PowerShell
# 清除缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ 问题 2：端口被占用（`EADDRINUSE`）

**原因**：之前的 Node 进程没有完全退出。

**解决**：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 结束进程（替换 PID 为实际数字）
taskkill /PID 12345 /F

# 或者一键结束所有 Node 进程
taskkill /F /IM node.exe
```

### ❌ 问题 3：MySQL 连接失败

**原因 1**：MySQL 服务未启动
```powershell
# 检查服务状态
Get-Service -Name "*mysql*"

# 启动服务（需管理员权限）
Start-Service -Name "MySQL80"  # 或你的服务名
```

**原因 2**：`.env` 中 `MYSQL_PASSWORD` 设置错误
- XAMPP 默认 MySQL root 密码**为空**
- 官方 MySQL Installer 安装时你设置的密码

**原因 3**：`MYSQL_SOCKET` 配置了 Linux socket 路径
- Windows 上**不要**设置 `MYSQL_SOCKET`
- 检查 `.env` 中是否有 `MYSQL_SOCKET=/var/run/mysqld/mysqld.sock`，如果有删除它

### ❌ 问题 4：上传文件失败

**原因 1**：`uploads/` 目录不存在或无权限
```powershell
# 在 backend 目录下创建 uploads 目录
cd backend
mkdir uploads
mkdir cache
mkdir quarantine
```

**原因 2**：Windows 路径字符编码问题
- 确保 `.env` 文件以 **UTF-8** 编码保存
- 路径中**不要**包含中文字符（项目文件夹不要放在中文目录下）

### ❌ 问题 5：文件上传后列表不刷新

**原因**：可能是浏览器缓存了旧代码。

**解决**：
```
在浏览器中按 Ctrl + Shift + Delete
清除缓存后刷新页面（Ctrl + F5 强制刷新）
```

### ❌ 问题 6：文件上传后暂停/恢复产生重复文件

**原因**：旧版本 bug，已修复。

**解决**：
```powershell
# 确保代码是最新的
cd D:\Projects\fileserver-new
git pull origin trae/solo-agent-ZzGRHy

# 重启服务
```

### ❌ 问题 7：前端热更新不工作

**原因**：Windows 文件系统的 Watcher 限制。

**解决**：
- 如果用的是 WSL2，需要在 WSL 内运行
- 如果是 Windows 原生，检查 Vite 配置中的 `server.watch`
- 尝试在前端目录执行：
  ```powershell
  cd frontend
  npx vite --force
  ```

### ❌ 问题 8：Node.js 版本过低

```powershell
# 检查版本
node --version

# 如果 < 18，需要升级
# 访问 https://nodejs.org/ 下载最新 LTS 版本
```

### ❌ 问题 9：`bcryptjs` 或 `sqlite3` 安装失败

**原因**：缺少编译工具链。

**解决**：
```powershell
# 以管理员身份运行 PowerShell
npm install --global windows-build-tools

# 或者安装 Visual Studio Build Tools
# 访问: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 安装 "Desktop development with C++" 工作负载
```

---

## 9. 日常开发流程

### 启动服务

```powershell
# 每天开始工作时
cd D:\Projects\fileserver-new
.\start-all.ps1
```

### 停止服务

```powershell
# 直接关闭两个 PowerShell 窗口
# 或者在每个窗口按 Ctrl + C
```

### 更新代码

```powershell
cd D:\Projects\fileserver-new
git pull origin trae/solo-agent-ZzGRHy

# 如果依赖有变化，重新安装
cd backend
npm install
cd ..\frontend
npm install
```

### 查看服务日志

```powershell
# 后端日志：查看 PowerShell 窗口 1 的输出
# 前端日志：查看 PowerShell 窗口 2 的输出
```

### 浏览器开发调试

- **前端**：按 F12 打开开发者工具，Console 查看 JavaScript 错误，Network 查看 API 请求
- **后端**：查看 PowerShell 窗口的输出日志

---

## 10. Windows 与 Linux 差异总结

| 项目 | Linux（云端容器） | Windows（本地） |
|------|-------------------|----------------|
| **路径分隔符** | `/`（正斜杠） | `\`（反斜杠），但 Node.js `path.join()` 自动处理 |
| **MySQL 连接** | Unix Socket: `/var/run/mysqld/mysqld.sock` | TCP: `127.0.0.1:3306` |
| **ClamAV 连接** | Unix Socket: `/var/run/clamav/clamd.ctl` | TCP: `127.0.0.1:3310` 或命令行 |
| **环境变量** | `.env` 文件 | `.env` 文件（相同格式） |
| **启动命令** | `./start-all.sh` | `.\start-all.ps1` |
| **数据库** | MySQL 推荐 | SQLite 推荐（零配置） |
| **换行符** | LF (`\n`) | CRLF (`\r\n`)，Git 会自动处理 |
| **进程管理** | `systemctl` / `service` | 服务管理器（services.msc） |

**Node.js 的跨平台设计**让大部分差异都被自动处理了（路径、文件读写、网络请求等）。你只需要关注 `.env` 配置中的数据库和病毒扫描方式。

---

## 下一步

完成以上步骤后，你应该已经可以在本地运行整个项目了。建议：

1. 先使用 **SQLite + file-header** 最简配置跑通项目
2. 确认功能正常后，按需切换到 **MySQL + ClamAV** 的完整配置
3. 遇到问题查看本文档的「常见问题排查」部分
4. 查看 [docs/BUGFIX.md](./BUGFIX.md) 了解已修复的问题

祝开发顺利！🚀
