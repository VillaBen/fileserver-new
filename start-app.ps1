# FileCloud Frontend & Backend Startup Script (Windows PowerShell)
# 前后端一键启动脚本（不包含MySQL/ClamAV启动）
# 适用于MySQL和ClamAV已运行的环境

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileCloud Frontend & Backend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# 进程ID文件路径
$BackendPidFile = Join-Path $ProjectRoot "backend.pid"
$FrontendPidFile = Join-Path $ProjectRoot "frontend.pid"

# ============ [检查] 前置服务状态 ============
Write-Host "[检查] 验证前置服务状态..." -ForegroundColor Yellow

# 检查MySQL
$MySQLRunning = $false
try {
    $result = mysqladmin ping -h 127.0.0.1 --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ MySQL 已连接" -ForegroundColor Green
        $MySQLRunning = $true
    }
} catch {}

if (-not $MySQLRunning) {
    Write-Host "  ⚠️  MySQL 未运行，请先启动MySQL服务" -ForegroundColor Yellow
    Write-Host "  ℹ️  参考: .\start-mysql.ps1" -ForegroundColor Cyan
}

# 检查ClamAV
$ClamAVRunning = $false
$ClamAVProcess = Get-Process -Name "clamd" -ErrorAction SilentlyContinue
if ($ClamAVProcess) {
    Write-Host "  ✅ ClamAV 已运行 (PID: $($ClamAVProcess.Id))" -ForegroundColor Green
    $ClamAVRunning = $true
} else {
    Write-Host "  ⚠️  ClamAV 未运行，请先启动ClamAV服务" -ForegroundColor Yellow
    Write-Host "  ℹ️  参考: .\start-clamav.ps1" -ForegroundColor Cyan
}

Write-Host ""

# ============ [1/2] 启动后端服务器 ============
Write-Host "[1/2] 启动 FileCloud 后端服务器..." -ForegroundColor Yellow

$BackendDir = Join-Path $ProjectRoot "backend"
if (Test-Path $BackendDir) {
    Set-Location $BackendDir

    # 检查 node_modules
    if (!(Test-Path "node_modules")) {
        Write-Host "  📦 正在安装后端依赖..." -ForegroundColor Cyan
        & npm install
    }

    # 检查 .env 文件（优先使用 Windows 专用配置）
    if (!(Test-Path ".env")) {
        Write-Host "  ⚠️  未找到 .env 文件，正在创建..." -ForegroundColor Yellow
        if (Test-Path ".env.example.windows") {
            Copy-Item ".env.example.windows" ".env"
            Write-Host "  ✅ 已使用 Windows 专用配置" -ForegroundColor Green
        } elseif (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "  ✅ 已使用默认配置" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  未找到配置模板" -ForegroundColor Red
        }
    }

    # 检查必要目录
    $RequiredDirs = @("uploads", "cache", "quarantine")
    foreach ($Dir in $RequiredDirs) {
        if (!(Test-Path $Dir)) {
            New-Item -ItemType Directory -Path $Dir | Out-Null
        }
    }

    # 初始化数据库
    if (Test-Path "scripts\init-db.js") {
        Write-Host "  🗄️  正在初始化数据库..." -ForegroundColor Cyan
        & node scripts\init-db.js 2>$null
    }

    # 停止旧的后端进程
    if (Test-Path $BackendPidFile) {
        $OldJobId = Get-Content $BackendPidFile -ErrorAction SilentlyContinue
        if ($OldJobId) {
            $OldJob = Get-Job -Id $OldJobId -ErrorAction SilentlyContinue
            if ($OldJob -and $OldJob.State -eq "Running") {
                Write-Host "  🛑 正在停止旧后端进程 (Job ID: $OldJobId)..." -ForegroundColor Cyan
                Stop-Job -Id $OldJobId -ErrorAction SilentlyContinue
                Remove-Job -Id $OldJobId -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
    }

    Write-Host "  🚀 正在启动后端服务器..." -ForegroundColor Cyan

    # 使用 Start-Job 在后台启动
    $BackendJob = Start-Job -ScriptBlock {
        param($WorkingDir)
        Set-Location $WorkingDir
        & npm start
    } -ArgumentList $BackendDir

    # 保存进程ID
    $BackendJob.Id | Out-File -FilePath $BackendPidFile -Force

    # 等待后端启动
    Write-Host "  - 等待后端启动 (5秒)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5

    # 检查作业状态
    if ($BackendJob.State -eq "Running") {
        Write-Host "  ✅ 后端已启动 (PID: $($BackendJob.Id))" -ForegroundColor Green
        Write-Host "  🌐 后端地址: http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  后端启动可能有问题，请检查日志" -ForegroundColor Yellow
    }

    Set-Location $ProjectRoot
} else {
    Write-Host "  ⚠️  未找到 backend 目录" -ForegroundColor Red
}

Write-Host ""

# ============ [2/2] 启动前端服务器 ============
Write-Host "[2/2] 启动 FileCloud 前端服务器..." -ForegroundColor Yellow

$FrontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path $FrontendDir) {
    Set-Location $FrontendDir

    # 检查 node_modules
    if (!(Test-Path "node_modules")) {
        Write-Host "  📦 正在安装前端依赖..." -ForegroundColor Cyan
        & npm install
    }

    # 停止旧的前端进程
    if (Test-Path $FrontendPidFile) {
        $OldJobId = Get-Content $FrontendPidFile -ErrorAction SilentlyContinue
        if ($OldJobId) {
            $OldJob = Get-Job -Id $OldJobId -ErrorAction SilentlyContinue
            if ($OldJob -and $OldJob.State -eq "Running") {
                Write-Host "  🛑 正在停止旧前端进程 (Job ID: $OldJobId)..." -ForegroundColor Cyan
                Stop-Job -Id $OldJobId -ErrorAction SilentlyContinue
                Remove-Job -Id $OldJobId -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
    }

    Write-Host "  🚀 正在启动前端服务器..." -ForegroundColor Cyan

    # 使用 Start-Job 在后台启动
    $FrontendJob = Start-Job -ScriptBlock {
        param($WorkingDir)
        Set-Location $WorkingDir
        & npm run dev -- --host
    } -ArgumentList $FrontendDir

    # 保存进程ID
    $FrontendJob.Id | Out-File -FilePath $FrontendPidFile -Force

    # 等待前端启动
    Write-Host "  - 等待前端启动 (5秒)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5

    if ($FrontendJob.State -eq "Running") {
        Write-Host "  ✅ 前端已启动 (PID: $($FrontendJob.Id))" -ForegroundColor Green
        Write-Host "  🌐 前端地址: http://localhost:5173" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  前端启动可能有问题，请检查日志" -ForegroundColor Yellow
    }

    Set-Location $ProjectRoot
} else {
    Write-Host "  ⚠️  未找到 frontend 目录" -ForegroundColor Red
}

Write-Host ""

# ============ 完成 ============
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 前后端服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 服务访问地址：" -ForegroundColor Cyan
Write-Host "  - 前端应用: http://localhost:5173" -ForegroundColor White
Write-Host "  - 后端 API:  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  📋 日志查看命令：" -ForegroundColor Cyan
Write-Host "  - 后端日志: Receive-Job -Id $(Get-Content $BackendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor White
Write-Host "  - 前端日志: Receive-Job -Id $(Get-Content $FrontendPidFile -ErrorAction SilentlyContinue)" -ForegroundColor White
Write-Host ""
Write-Host "  🛑 停止服务命令：" -ForegroundColor Cyan
Write-Host "  .\stop-all.ps1" -ForegroundColor White
Write-Host ""