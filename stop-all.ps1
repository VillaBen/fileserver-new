# FileCloud All-in-One Stop Script (Windows PowerShell)
# 综合停止脚本：停止后端和前端服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileCloud All-in-One Stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# 进程ID文件路径
$BackendPidFile = Join-Path $ProjectRoot "backend.pid"
$FrontendPidFile = Join-Path $ProjectRoot "frontend.pid"

# ============ [1/4] 停止后端服务 ============
Write-Host "[1/4] 正在停止后端服务..." -ForegroundColor Yellow

if (Test-Path $BackendPidFile) {
    $BackendJobId = Get-Content $BackendPidFile -ErrorAction SilentlyContinue
    if ($BackendJobId) {
        try {
            $BackendJob = Get-Job -Id $BackendJobId -ErrorAction Stop
            if ($BackendJob) {
                Stop-Job -Id $BackendJobId -Force
                Remove-Job -Id $BackendJobId -Force
                Write-Host "  ✅ 后端服务已停止" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ⚠️  后端作业 $BackendJobId 未找到" -ForegroundColor Yellow
        }
    }
    Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "  ⚠️  未找到后端进程信息" -ForegroundColor Yellow
}

# 备用方案：通过端口查找进程并停止
Write-Host "  - 检查端口 3000..." -ForegroundColor Cyan
$BackendProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue | 
    ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }

if ($BackendProcess) {
    Write-Host "  - 发现后端进程 ID: $($BackendProcess.Id)" -ForegroundColor Yellow
    try {
        $BackendProcess | Stop-Process -Force
        Write-Host "  ✅ 后端进程已停止" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  停止后端进程失败" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============ [2/4] 停止前端服务 ============
Write-Host "[2/4] 正在停止前端服务..." -ForegroundColor Yellow

if (Test-Path $FrontendPidFile) {
    $FrontendJobId = Get-Content $FrontendPidFile -ErrorAction SilentlyContinue
    if ($FrontendJobId) {
        try {
            $FrontendJob = Get-Job -Id $FrontendJobId -ErrorAction Stop
            if ($FrontendJob) {
                Stop-Job -Id $FrontendJobId -Force
                Remove-Job -Id $FrontendJobId -Force
                Write-Host "  ✅ 前端服务已停止" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ⚠️  前端作业 $FrontendJobId 未找到" -ForegroundColor Yellow
        }
    }
    Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "  ⚠️  未找到前端进程信息" -ForegroundColor Yellow
}

# 备用方案：通过端口查找进程并停止
Write-Host "  - 检查端口 5173..." -ForegroundColor Cyan
$FrontendProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue | 
    ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }

if ($FrontendProcess) {
    Write-Host "  - 发现前端进程 ID: $($FrontendProcess.Id)" -ForegroundColor Yellow
    try {
        $FrontendProcess | Stop-Process -Force
        Write-Host "  ✅ 前端进程已停止" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  停止前端进程失败" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============ [3/4] 停止相关 Node 进程 (可选) ============
Write-Host "[3/4] 检查相关 Node 进程..." -ForegroundColor Yellow

$NodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.MainWindowTitle -like "*FileCloud*" -or 
        $_.Path -like "*$ProjectRoot*" 
    }

if ($NodeProcesses) {
    Write-Host "  - 发现 $($NodeProcesses.Count) 个相关 Node 进程" -ForegroundColor Yellow
    foreach ($Process in $NodeProcesses) {
        try {
            Stop-Process -Id $Process.Id -Force
            Write-Host "  ✅ 进程 $($Process.Id) 已停止" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  停止进程 $($Process.Id) 失败" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  - 未发现相关 Node 进程" -ForegroundColor Green
}

Write-Host ""

# ============ [4/4] 清理临时文件 ============
Write-Host "[4/4] 清理临时文件..." -ForegroundColor Yellow

$TempFiles = @(
    $BackendPidFile,
    $FrontendPidFile,
    (Join-Path $ProjectRoot "*.pid")
)

$CleanedCount = 0
foreach ($File in $TempFiles) {
    if (Test-Path $File) {
        Remove-Item $File -Force -ErrorAction SilentlyContinue
        $CleanedCount++
    }
}

Write-Host "  ✅ 已清理 $CleanedCount 个临时文件" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 所有服务已停止" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 状态检查：" -ForegroundColor Cyan

# 检查端口状态
$Port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$Port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($Port3000) {
    Write-Host "  ⚠️  端口 3000 仍在使用" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ 端口 3000 已释放" -ForegroundColor Green
}

if ($Port5173) {
    Write-Host "  ⚠️  端口 5173 仍在使用" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ 端口 5173 已释放" -ForegroundColor Green
}

Write-Host ""
Write-Host "  💡 提示：" -ForegroundColor Cyan
Write-Host "  - 如需重新启动服务，运行: .\start-all.ps1" -ForegroundColor White
Write-Host ""
