# FileCloud All-in-One Startup Script (Windows PowerShell)
# 综合启动脚本：启动后端、前端以及可选的 MySQL/ClamAV

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileCloud All-in-One Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# 进程ID文件路径
$BackendPidFile = Join-Path $ProjectRoot "backend.pid"
$FrontendPidFile = Join-Path $ProjectRoot "frontend.pid"

# ============ [1/6] 启动 MySQL (可选) ============
Write-Host "[1/6] 检查 MySQL 服务..." -ForegroundColor Yellow
$MySQLInstalled = $false
$MySQLService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*mysql*" }

if ($MySQLService) {
    if ($MySQLService.Status -eq "Running") {
        Write-Host "  ✅ MySQL 服务已在运行" -ForegroundColor Green
        $MySQLInstalled = $true
    } else {
        Write-Host "  - 正在启动 MySQL 服务..." -ForegroundColor Cyan
        try {
            Start-Service -Name $MySQLService.Name -ErrorAction Stop
            Write-Host "  ✅ MySQL 服务已启动" -ForegroundColor Green
            $MySQLInstalled = $true
        } catch {
            Write-Host "  ⚠️  MySQL 启动失败，将使用 SQLite" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ⚠️  未找到 MySQL，将使用 SQLite" -ForegroundColor Yellow
}

Write-Host ""

# ============ [2/6] 启动 ClamAV (可选) ============
Write-Host "[2/6] 检查 ClamAV 状态..." -ForegroundColor Yellow
$ClamAVInstalled = $false

try {
    $null = Get-Command freshclam -ErrorAction Stop
    $ClamAVInstalled = $true
    Write-Host "  ✅ ClamAV 已就绪" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  ClamAV 未安装，将使用文件头检测模式" -ForegroundColor Yellow
}

Write-Host ""

# ============ [3/6] 启动后端服务器 ============
Write-Host "[3/6] 启动 FileCloud 后端服务器..." -ForegroundColor Yellow

$BackendDir = Join-Path $ProjectRoot "backend"
if (Test-Path $BackendDir) {
    Set-Location $BackendDir

    # 检查 node_modules
    if (!(Test-Path "node_modules")) {
        Write-Host "  - 正在安装后端依赖..." -ForegroundColor Cyan
        & npm install
    }

    # 检查 .env 文件（优先使用 Windows 专用配置）
    if (!(Test-Path ".env")) {
        Write-Host "  - 正在创建 .env 文件..." -ForegroundColor Cyan
        if (Test-Path ".env.example.windows") {
            # 优先复制 Windows 专用配置（适配 TCP 连接，不使用 socket）
            Copy-Item ".env.example.windows" ".env"
            Write-Host "  ✅ 已使用 Windows 专用配置 (.env.example.windows)" -ForegroundColor Green
        } elseif (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "  ✅ 已使用默认配置 (.env.example)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  未找到配置模板，请手动创建 .env 文件" -ForegroundColor Yellow
        }
    }

    # 检查必要目录
    $RequiredDirs = @("uploads", "cache", "quarantine")
    foreach ($Dir in $RequiredDirs) {
        if (!(Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir | Out-Null
            Write-Host "  - 创建目录: $Dir" -ForegroundColor Cyan
        }
    }

    # 初始化数据库（如果有脚本）
    if (Test-Path "scripts\init-db.js") {
        Write-Host "  - 正在初始化数据库..." -ForegroundColor Cyan
        & node scripts\init-db.js 2>$null
    }

    Write-Host "  - 正在启动后端服务器..." -ForegroundColor Cyan

    # 使用 Start-Job 在后台启动
    $BackendJob = Start-Job -ScriptBlock {
        param($WorkingDir)
        Set-Location $WorkingDir
        & npm start
    } -ArgumentList $BackendDir

    # 保存进程ID（虽然使用Job，但我们记录启动信息）
    $BackendJob.Id | Out-File -FilePath $BackendPidFile -Force

    # 等待后端启动
    Write-Host "  - 等待后端启动 (5秒)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5

    # 检查作业状态
    if ($BackendJob.State -eq "Running") {
        Write-Host "  ✅ 后端已启动" -ForegroundColor Green
        Write-Host "  🌐 后端地址: http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  后端启动可能有问题" -ForegroundColor Yellow
    }

    Set-Location $ProjectRoot
} else {
    Write-Host "  ⚠️  未找到 backend 目录" -ForegroundColor Red
}

Write-Host ""

# ============ [4/6] 启动前端服务器 ============
Write-Host "[4/6] 启动 FileCloud 前端服务器..." -ForegroundColor Yellow

$FrontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path $FrontendDir) {
    Set-Location $FrontendDir

    # 检查 node_modules
    if (!(Test-Path "node_modules")) {
        Write-Host "  - 正在安装前端依赖..." -ForegroundColor Cyan
        & npm install
    }

    Write-Host "  - 正在启动前端服务器..." -ForegroundColor Cyan

    # 使用 Start-Job 在后台启动
    $FrontendJob = Start-Job -ScriptBlock {
        param($WorkingDir)
        Set-Location $WorkingDir
        & npm run dev
    } -ArgumentList $FrontendDir

    # 保存进程ID
    $FrontendJob.Id | Out-File -FilePath $FrontendPidFile -Force

    # 等待前端启动
    Write-Host "  - 等待前端启动 (5秒)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5

    if ($FrontendJob.State -eq "Running") {
        Write-Host "  ✅ 前端已启动" -ForegroundColor Green
        Write-Host "  🌐 前端地址: http://localhost:5173" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  前端启动可能有问题" -ForegroundColor Yellow
    }

    Set-Location $ProjectRoot
} else {
    Write-Host "  ⚠️  未找到 frontend 目录" -ForegroundColor Red
}

Write-Host ""

# ============ [5/6] 保存进程信息 ============
Write-Host "[5/6] 保存进程信息..." -ForegroundColor Yellow

Write-Host "  - 后端 Job ID: $(Get-Content $BackendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor Green
Write-Host "  - 前端 Job ID: $(Get-Content $FrontendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor Green
Write-Host "  ✅ 进程信息已保存" -ForegroundColor Green

Write-Host ""

# ============ [6/6] 完成启动 ============
Write-Host "[6/6] 所有服务启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ FileCloud 已就绪" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 服务访问地址：" -ForegroundColor Cyan
Write-Host "  - 前端应用: http://localhost:5173" -ForegroundColor White
Write-Host "  - 后端 API:  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  📋 数据库：" -ForegroundColor Cyan
if ($MySQLInstalled) {
    Write-Host "  - MySQL 已就绪" -ForegroundColor Green
} else {
    Write-Host "  - SQLite 已就绪 (默认)" -ForegroundColor Green
}
Write-Host ""
Write-Host "  🛡️  恶意文件检测：" -ForegroundColor Cyan
if ($ClamAVInstalled) {
    Write-Host "  - ClamAV 模式" -ForegroundColor Green
} else {
    Write-Host "  - 文件头检测模式" -ForegroundColor Green
}
Write-Host ""
Write-Host "  ⏹️  停止服务命令：" -ForegroundColor Cyan
Write-Host "  .\stop-all.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  💡 提示：" -ForegroundColor Cyan
Write-Host "  - 如需查看后端日志：Receive-Job -Id $(Get-Content $BackendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor White
Write-Host "  - 如需查看前端日志：Receive-Job -Id $(Get-Content $FrontendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor White
Write-Host ""
