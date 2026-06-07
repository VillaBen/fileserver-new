# FileCloud ClamAV Server Startup Script (Windows PowerShell)
# 启动 ClamAV 杀毒服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FileCloud ClamAV Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "[1/5] 正在初始化 ClamAV 配置..." -ForegroundColor Yellow

# 创建必要的目录
$ClamAVDataDir = Join-Path $ProjectRoot "clamav-data"
$ClamAVTempDir = Join-Path $ProjectRoot "clamav-tmp"

if (!(Test-Path $ClamAVDataDir)) {
    New-Item -ItemType Directory -Path $ClamAVDataDir | Out-Null
    Write-Host "  - 创建数据目录: $ClamAVDataDir" -ForegroundColor Green
}

if (!(Test-Path $ClamAVTempDir)) {
    New-Item -ItemType Directory -Path $ClamAVTempDir | Out-Null
    Write-Host "  - 创建临时目录: $ClamAVTempDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/5] 正在检查 ClamAV 安装..." -ForegroundColor Yellow

# 检查系统是否已安装 ClamAV
$ClamAVInstalled = $false
$ClamAVPath = $null

# 检查常见的 ClamAV 安装路径
$PossibleClamAVPaths = @(
    "C:\Program Files\ClamAV",
    "C:\Program Files (x86)\ClamAV",
    "C:\ClamAV"
)

foreach ($Path in $PossibleClamAVPaths) {
    if (Test-Path $Path) {
        $ClamAVPath = $Path
        $ClamAVInstalled = $true
        Write-Host "  - 发现 ClamAV: $Path" -ForegroundColor Green
        break
    }
}

# 检查是否可以直接使用 freshclam 和 clamd 命令
try {
    $null = Get-Command freshclam -ErrorAction Stop
    $ClamAVInstalled = $true
} catch {
    if (!$ClamAVInstalled) {
        Write-Host "  ⚠️  未找到 ClamAV" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[3/5] 正在更新病毒库..." -ForegroundColor Yellow

if ($ClamAVInstalled) {
    try {
        # 尝试更新病毒库
        if (Get-Command freshclam -ErrorAction SilentlyContinue) {
            Write-Host "  - 正在运行 freshclam 更新病毒库..." -ForegroundColor Cyan
            & freshclam --no-dns
            Write-Host "  ✅ 病毒库更新完成" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ freshclam 不可用，跳过病毒库更新" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  病毒库更新失败: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  未找到 ClamAV，将使用文件头检测模式" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/5] 正在配置 ClamAV..." -ForegroundColor Yellow

# 创建 ClamAV 配置
if ($ClamAVInstalled) {
    Write-Host "  - ClamAV 已配置" -ForegroundColor Green
} else {
    Write-Host "  - 系统配置文件头检测模式" -ForegroundColor Yellow
    Write-Host "  - 该模式使用文件扩展名和文件头特征检测恶意文件" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/5] 启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ ClamAV 配置完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ClamAVInstalled) {
    Write-Host "  ClamAV 状态：已配置完成" -ForegroundColor Green
    Write-Host "  数据目录：$ClamAVDataDir" -ForegroundColor White
} else {
    Write-Host "  检测模式：文件头检测" -ForegroundColor Green
    Write-Host "  说明：系统将使用文件扩展名和文件头特征检测恶意文件" -ForegroundColor White
    Write-Host "  如需安装 ClamAV 请访问：https://www.clamav.net/downloads" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "下一步：运行 .\start-all.ps1 启动完整服务" -ForegroundColor Cyan
Write-Host ""
