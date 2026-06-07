#!/bin/bash

# ==============================================
# FileCloud 服务停止脚本
# ==============================================

echo "=========================================="
echo "  🛑  FileCloud 服务停止脚本"
echo "=========================================="
echo ""

# 项目根目录
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$PROJECT_ROOT"

# 停止进程的函数
stop_process() {
    local pid_file="$1"
    local service_name="$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ]; then
            if kill -0 "$pid" 2>/dev/null; then
                echo "  ⏹️  停止 $service_name (PID: $pid)..."
                kill "$pid" 2>/dev/null
                sleep 2
                if kill -0 "$pid" 2>/dev/null; then
                    echo "  ⚠️  $service_name 未响应，强制停止..."
                    kill -9 "$pid" 2>/dev/null
                fi
                echo "  ✅ $service_name 已停止"
            fi
        fi
        rm -f "$pid_file"
    else
        echo "  ℹ️  未找到 $service_name 的 PID 文件"
    fi
}

# ==============================================
# 1. 停止前端
# ==============================================
echo "[1/4] 停止前端服务..."
stop_process "$PROJECT_ROOT/frontend.pid" "前端"
echo ""

# ==============================================
# 2. 停止后端
# ==============================================
echo "[2/4] 停止后端服务..."
stop_process "$PROJECT_ROOT/backend.pid" "后端"
echo ""

# ==============================================
# 3. 停止 ClamAV
# ==============================================
echo "[3/4] 停止 ClamAV 服务..."
stop_process "$PROJECT_ROOT/clamav.pid" "ClamAV"
# 尝试使用 pkill 清理剩余的 clam 进程
pkill -f "clamd" 2>/dev/null || true
echo ""

# ==============================================
# 4. 停止 MySQL
# ==============================================
echo "[4/4] 停止 MySQL 服务..."
stop_process "$PROJECT_ROOT/mysql.pid" "MySQL"
# 尝试清理剩余的 mysql 进程
pkill -f "mysqld" 2>/dev/null || true
echo ""

# ==============================================
# 清理临时文件
# ==============================================
echo "清理临时文件..."
rm -f "$PROJECT_ROOT/mysql.pid" "$PROJECT_ROOT/clamav.pid" \
      "$PROJECT_ROOT/backend.pid" "$PROJECT_ROOT/frontend.pid"
echo "  ✅ 临时文件已清理"
echo ""

# ==============================================
# 完成
# ==============================================
echo "=========================================="
echo "  ✅  所有服务已停止！"
echo "=========================================="
echo ""
echo "  💡 提示：如需清理日志文件："
echo "  rm -f $PROJECT_ROOT/backend.log $PROJECT_ROOT/frontend.log"
echo ""
