
# ClamAV 安装和配置指南

&gt; 本指南帮助您在 FileCloud 中集成 ClamAV 反病毒扫描器。

## 目录
- [概述](#概述)
- [安装 ClamAV](#安装-clamav)
  - [Ubuntu/Debian](#ubuntudebian)
  - [CentOS/RHEL](#centosrhel)
  - [macOS](#macos)
  - [Windows](#windows)
- [FileCloud 配置](#filecloud-配置)
- [ClamAV 使用模式](#clamav-使用模式)
- [验证安装](#验证安装)
- [常见问题](#常见问题)

---

## 概述

FileCloud 支持多种恶意文件检测方式：

| 模式 | 说明 |
|------|------|
| `file-header` | 文件头检测（默认，无需额外安装） |
| `clamav` | 仅使用 ClamAV 扫描 |
| `hybrid` | 文件头检测 + ClamAV（推荐） |
| `disabled` | 禁用检测 |

---

## 安装 ClamAV

### Ubuntu/Debian

```bash
# 更新包列表
sudo apt update

# 安装 ClamAV 守护进程和扫描工具
sudo apt install -y clamav clamav-daemon

# 停止守护进程以便更新病毒库
sudo systemctl stop clamav-daemon

# 更新病毒库
sudo freshclam

# 启动并启用守护进程
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon

# 检查状态
sudo systemctl status clamav-daemon
```

### CentOS/RHEL

```bash
# 安装 EPEL 仓库
sudo yum install -y epel-release

# 安装 ClamAV
sudo yum install -y clamav clamav-update clamav-server clamav-data

# 更新病毒库
sudo freshclam

# 启动守护进程
sudo systemctl start clamav-freshclam
sudo systemctl enable clamav-freshclam
sudo systemctl start clamd@scan
sudo systemctl enable clamd@scan
```

### macOS

使用 Homebrew：

```bash
brew install clamav

# 初始化配置
cp /usr/local/etc/clamav/freshclam.conf.sample /usr/local/etc/clamav/freshclam.conf

# 更新病毒库
freshclam

# 测试扫描
clamscan --version
```

### Windows

1. 下载 ClamAV for Windows: https://www.clamav.net/downloads
2. 解压并安装
3. 配置 `freshclam.conf` 和 `clamd.conf`
4. 运行 `freshclam` 更新病毒库

---

## FileCloud 配置

### 1. 配置环境变量

在 `backend/.env` 文件中添加：

```env
# 恶意文件检测配置
MALWARE_SCAN_MODE=hybrid

# ClamAV 配置
CLAMAV_SOCKET=/var/run/clamav/clamd.ctl
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=60000

# 检测失败时是否阻止上传
BLOCK_ON_FAILURE=true
```

### 2. 可用的配置选项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `MALWARE_SCAN_MODE` | `file-header` | 检测模式 |
| `CLAMAV_SOCKET` | `/var/run/clamav/clamd.ctl` | ClamAV 套接字路径 |
| `CLAMAV_HOST` | `127.0.0.1` | ClamAV 主机 |
| `CLAMAV_PORT` | `3310` | ClamAV 端口 |
| `CLAMAV_TIMEOUT` | `60000` | 超时毫秒 |
| `CLAMAV_REMOVE_INFECTED` | `false` | 是否自动删除感染文件 |
| `CLAMAV_QUARANTINE_INFECTED` | `false` | 是否隔离感染文件 |
| `CLAMAV_QUARANTINE_PATH` | `./quarantine` | 隔离目录 |

---

## ClamAV 使用模式

### 模式 1: file-header（默认）

无需安装 ClamAV，基于文件扩展名和文件头签名检测可疑文件。

**优点:**
- 无需额外安装
- 快速
- 零依赖

**缺点:**
- 检测能力有限
- 可能产生误报

### 模式 2: clamav

仅使用 ClamAV 进行完整病毒扫描。

**优点:**
- 检测能力强
- 权威的病毒库
- 误报率低

**缺点:**
- 需要安装 ClamAV
- 扫描速度较慢

### 模式 3: hybrid（推荐）

先进行快速文件头检测，再进行 ClamAV 完整扫描。

**优点:**
- 平衡速度和安全性
- ClamAV 不可用时自动降级到文件头检测

**推荐在生产环境使用此模式。

---

## 验证安装

### 1. 验证 ClamAV 安装

```bash
# 检查 ClamAV 版本
clamscan --version

# 测试扫描一个安全文件
clamscan /path/to/safe/file

# 测试 clamd 状态
clamdscan --version
```

### 2. 验证 FileCloud 集成

启动 FileCloud 后端服务器，查看日志：

```
✅ ClamAV 初始化成功
🎉 FileCloud 服务器已启动
🛡️  恶意文件检测模式: hybrid
```

### 3. 上传测试

上传一个文件，检查日志。

---

## 常见问题

### Q: ClamAV 初始化失败怎么办？

A: 检查以下几点：
1. clamd 守护进程是否运行
2. socket/host/port 是否正确
3. 病毒库是否已更新

### Q: 如何更新 ClamAV 病毒库？

```bash
# Linux
sudo freshclam

# 手动更新
sudo systemctl restart clamav-daemon
```

### Q: 检测到恶意文件时会发生什么？

上传会被阻止，返回错误响应：
```json
{
  "success": false,
  "error": "检测到恶意文件或可疑内容",
  "code": "MALWARE_DETECTED"
}
```

### Q: 如何在没有 ClamAV 的生产环境？

使用 `file-header` 模式，它提供基础的安全检测能力。

---

## 性能优化建议

- 使用 `hybrid` 模式
- 定期更新病毒库
- 配置合理的超时时间
- 根据需要调整配置

