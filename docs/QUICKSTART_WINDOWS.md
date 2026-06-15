# FileCloud Windows 快速启动指南 🚀

只需 5 分钟，即可在 Windows 本地运行整个项目！

---

## ⚡ 快速开始（推荐路径）

### 第 1 步：准备软件（已安装请跳过）

确保你的电脑安装了：
- ✅ **Node.js**（>= 18.x）→ https://nodejs.org/
- ✅ **Git** → https://git-scm.com/download/win

### 第 2 步：下载项目代码

**以管理员身份**打开 PowerShell，运行：

```powershell
# 进入项目目录（按需修改路径，不要放在中文目录！）
D:
cd Projects

# 克隆代码（需要有 GitHub 访问权限）
git clone https://github.com/VillaBen/fileserver-new.git
cd fileserver-new

# 切换到开发分支
git checkout trae/solo-agent-ZzGRHy
```

### 第 3 步：一键启动

**在项目根目录运行：**
```powershell
.\start-all.ps1
```

脚本会自动：
1. ✅ 检查/创建 `.env` 配置（默认 SQLite + 文件头检测）
2. ✅ 安装后端依赖（`npm install`）
3. ✅ 安装前端依赖（`npm install`）
4. ✅ 创建必要目录（`uploads`, `cache`, `quarantine`）
5. ✅ 初始化数据库
6. ✅ 启动后端服务（http://localhost:3000）
7. ✅ 启动前端服务（http://localhost:5173）

### 第 4 步：访问应用

打开浏览器访问：**http://localhost:5173**

1. 点击"注册"创建账号
2. 填写用户名、邮箱、密码 → 提交
3. 登录后即可开始使用！🎉

---

## 💡 想要更强大的功能？

### 切换到 MySQL（可选）

如果你已经安装了 MySQL（或 XAMPP），想要切换到 MySQL 数据库：

```powershell
# 1. 先停止服务
.\stop-all.ps1

# 2. 进入 backend 目录，修改 .env 文件
cd backend
notepad .env

# 3. 将 DB_TYPE 改为 mysql，并填写数据库信息：
#    DB_TYPE=mysql
#    MYSQL_HOST=127.0.0.1
#    MYSQL_PORT=3306
#    MYSQL_USER=root
#    MYSQL_PASSWORD=你的密码（XAMPP 默认空）
#    MYSQL_DATABASE=fileserver

# 4. 创建数据库（在 MySQL 命令行或 phpMyAdmin 中运行）
#    CREATE DATABASE fileserver CHARACTER SET utf8mb4;

# 5. 回到项目根目录，重启服务
cd ..
.\start-all.ps1
```

### 启用 ClamAV 病毒扫描（可选）

1. 下载安装 ClamAV：https://www.clamav.net/downloads
2. 安装后在 PowerShell 验证：`freshclam --version`
3. 修改 `backend\.env`：
   ```
   MALWARE_SCAN_MODE=clamav
   ```
4. 重启服务：`.\stop-all.ps1` → `.\start-all.ps1`

---

## 🔧 日常开发

| 操作 | PowerShell 命令 |
|------|----------------|
| **启动所有服务** | `cd D:\Projects\fileserver-new` <br> `.\start-all.ps1` |
| **停止所有服务** | `.\stop-all.ps1` |
| **仅启动前后端** | `.\start-app.ps1`（MySQL/ClamAV 已在运行时用） |
| **查看后端日志** | `Receive-Job -Id <后端JobID>` |
| **查看前端日志** | `Receive-Job -Id <前端JobID>` |
| **强制刷新浏览器** | 按 `Ctrl + F5` |
| **更新代码** | `git pull origin trae/solo-agent-ZzGRHy` |

---

## ❓ 常见问题

### Q1. 运行 PowerShell 脚本时提示"禁止运行脚本"？

**原因**：Windows PowerShell 的默认执行策略限制。

**解决**（以管理员身份运行 PowerShell）：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# 输入 Y 确认
```

### Q2. `npm install` 很慢或失败？

**原因**：默认使用国外 npm 源服务器。

**解决**：
```powershell
# 临时使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或永久设置
npm config set registry https://registry.npmmirror.com
```

### Q3. 端口被占用？（3000 或 5173）

```powershell
# 一键结束所有 Node 进程
taskkill /F /IM node.exe

# 然后重新启动
.\start-all.ps1
```

### Q4. `node_modules` 安装失败？

```powershell
# 以管理员身份运行 PowerShell
# 清除缓存后重新安装
cd backend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm cache clean --force
npm install

# 前端同理
cd ..\frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Q5. 上传文件后列表没刷新？

**原因**：浏览器缓存了旧版 JavaScript。

**解决**：在浏览器按 `Ctrl + Shift + Delete` 清除缓存，或按 `Ctrl + F5` 强制刷新。

### Q6. 前端页面空白？

```powershell
# 1. 检查前端服务是否在运行
# 2. 查看前端 PowerShell 窗口输出
# 3. 尝试重新构建
cd frontend
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

---

## 📁 项目文件说明

```
fileserver-new/
├── backend/                  # 后端（Node.js + Express）
│   ├── .env.example.windows  # ✨ Windows 专用环境变量模板
│   ├── src/                  # 源代码（路由、中间件、控制器）
│   └── server.js             # 服务入口
├── frontend/                 # 前端（Vue 3 + Vite）
│   └── src/                  # 页面、组件、状态管理
├── docs/                     # 📖 文档目录
│   ├── WINDOWS_SETUP.md      # ✨ Windows 完整开发指南
│   ├── BUGFIX.md             # 问题修复记录
│   └── ...
├── start-all.ps1             # ✨ Windows 一键启动脚本
├── start-app.ps1             # 仅启动前后端脚本
├── start-mysql.ps1           # MySQL 启动脚本
├── start-clamav.ps1          # ClamAV 启动脚本
├── stop-all.ps1              # ✨ Windows 停止脚本
└── README.md                 # 项目说明
```

---

## 🎯 下一步建议

1. ✅ 先使用默认配置（**SQLite + 文件头检测**）跑通项目
2. 阅读 [docs/WINDOWS_SETUP.md](./WINDOWS_SETUP.md) 了解更多配置选项
3. 阅读 [docs/BUGFIX.md](./BUGFIX.md) 了解已修复的问题
4. 根据需要切换到 MySQL + ClamAV 的完整配置

---

## 🔗 更多文档

- **完整开发指南**：[docs/WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
- **修复记录**：[docs/BUGFIX.md](./BUGFIX.md)
- **MySQL 安装指南**：[docs/MYSQL_MIGRATION.md](./MYSQL_MIGRATION.md)
- **ClamAV 安装指南**：[docs/CLAMAV_SETUP.md](./CLAMAV_SETUP.md)

有任何问题，优先查看文档！祝开发顺利 🎉
