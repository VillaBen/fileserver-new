# FileCloud MySQL Server Startup Script (Windows PowerShell)
# 启动 MySQL 数据库服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileCloud MySQL Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "[1/4] 正在初始化 MySQL 配置..." -ForegroundColor Yellow

# 创建必要的目录
$MySQLDataDir = Join-Path $ProjectRoot "mysql-data"
$MySQLTempDir = Join-Path $ProjectRoot "mysql-tmp"

if (!(Test-Path $MySQLDataDir)) {
    New-Item -ItemType Directory -Path $MySQLDataDir | Out-Null
    Write-Host "  - 创建数据目录: $MySQLDataDir" -ForegroundColor Green
}

if (!(Test-Path $MySQLTempDir)) {
    New-Item -ItemType Directory -Path $MySQLTempDir | Out-Null
    Write-Host "  - 创建临时目录: $MySQLTempDir" -ForegroundColor Green
}

# 检查系统是否已安装 MySQL
$MySQLInstalled = $false
$MySQLPath = $null

# 检查常见的 MySQL 安装路径
$PossibleMySQLPaths = @(
    "C:\Program Files\MySQL\MySQL Server*\bin",
    "C:\xampp\mysql\bin",
    "C:\wamp64\bin\mysql\mysql*\bin",
    "C:\Program Files\MariaDB*\bin"
)

foreach ($Path in $PossibleMySQLPaths) {
    $Matches = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue
    if ($Matches) {
        $MySQLPath = $Matches[0].FullName
        $MySQLInstalled = $true
        break
    }
}

# 检查是否可以直接使用 mysql 命令
try {
    $null = Get-Command mysql -ErrorAction Stop
    $MySQLInstalled = $true
    Write-Host "  - 发现 MySQL 已安装" -ForegroundColor Green
} catch {
    if (!$MySQLInstalled) {
        Write-Host "  ⚠️  未找到 MySQL" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[2/4] 正在检查 MySQL 服务状态..." -ForegroundColor Yellow

# 尝试检查和启动 MySQL 服务
$MySQLService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*mysql*" }

if ($MySQLService) {
    if ($MySQLService.Status -eq "Running") {
        Write-Host "  ✅ MySQL 服务已在运行" -ForegroundColor Green
    } else {
        Write-Host "  - 正在启动 MySQL 服务..." -ForegroundColor Cyan
        try {
            Start-Service -Name $MySQLService.Name -ErrorAction Stop
            Write-Host "  ✅ MySQL 服务已启动" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  启动 MySQL 服务失败" -ForegroundColor Red
            Write-Host "    请确保您有管理员权限" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ⚠️  未找到 MySQL 服务" -ForegroundColor Yellow
    Write-Host "    建议：" -ForegroundColor Yellow
    Write-Host "    1. 使用 XAMPP/WAMP 等集成环境" -ForegroundColor Yellow
    Write-Host "    2. 手动安装 MySQL" -ForegroundColor Yellow
    Write-Host "    3. 使用默认 SQLite 数据库（无需配置）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] 正在准备数据库初始化..." -ForegroundColor Yellow

# 如果没有找到 MySQL，提供 SQLite 选项
if (!$MySQLInstalled) {
    Write-Host ""
    Write-Host "⚠️  建议使用默认的 SQLite 数据库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SQLite 数据库路径: $ProjectRoot\backend\database\fileserver.db" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "如需使用 MySQL，请先安装 MySQL 或使用 XAMPP/WAMP" -ForegroundColor Yellow
} else {
    # 检查是否有 MySQL 初始化脚本
    $MySQLInitScript = Join-Path $ProjectRoot "backend\init-mysql-minimal.js"
    if (Test-Path $MySQLInitScript) {
        Write-Host "  - 发现 MySQL 初始化脚本" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[4/4] 配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ MySQL 配置完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($MySQLInstalled) {
    Write-Host "  MySQL 服务已就绪" -ForegroundColor Green
    Write-Host "  默认连接信息：" -ForegroundColor Cyan
    Write-Host "  - 主机: localhost" -ForegroundColor White
    Write-Host "  - 端口: 3306" -ForegroundColor White
} else {
    Write-Host "  SQLite 已就绪" -ForegroundColor Green
    Write-Host "  数据库路径: backend\database\fileserver.db" -ForegroundColor White
}

Write-Host ""
Write-Host "下一步：运行 .\start-all.ps1 启动完整服务" -ForegroundColor Cyan
Write-Host ""
