#!/bin/bash

# ==============================================
# FileCloud 前后端一键启动脚本
# 仅启动后端API和前端（不包含MySQL/ClamAV）
# 适用于MySQL和ClamAV已运行的环境
# ==============================================

echo "=========================================="
echo "  🚀  FileCloud 前后端启动脚本"
echo "=========================================="
echo ""

# 项目根目录
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$PROJECT_ROOT"

# ==============================================
# 检查前置服务
# ==============================================
echo "[检查] 验证前置服务状态..."

# 检查MySQL
if mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
    echo "  ✅ MySQL 已连接"
else
    echo "  ⚠️  MySQL 未运行，请先启动MySQL服务"
    echo "  ℹ️  参考: ./start-mysql.sh"
fi

# 检查ClamAV
if pgrep -x "clamd" > /dev/null 2>&1; then
    echo "  ✅ ClamAV 已运行"
else
    echo "  ⚠️  ClamAV 未运行，请先启动ClamAV服务"
    echo "  ℹ️  参考: ./start-clamav.sh"
fi

echo ""

# ==============================================
# 1. 启动后端服务
# ==============================================
echo "[1/2] 启动 FileCloud 后端服务..."
if [ -d "$PROJECT_ROOT/backend" ]; then
    cd "$PROJECT_ROOT/backend"

    # 检查 node_modules 是否存在
    if [ ! -d "node_modules" ]; then
        echo "  📦  安装后端依赖..."
        npm install
    fi

    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        echo "  ⚠️  未找到 .env 文件，使用示例配置..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "  ✅ 已创建 .env 文件"
        fi
    fi

    # 检查并初始化数据库
    if [ -f "scripts/init-db.js" ]; then
        echo "  🗄️  初始化数据库..."
        node scripts/init-db.js 2>/dev/null
    fi

    # 停止已有的后端进程
    if [ -f "$PROJECT_ROOT/backend.pid" ]; then
        OLD_PID=$(cat "$PROJECT_ROOT/backend.pid")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "  🛑  停止旧后端进程 (PID: $OLD_PID)..."
            kill "$OLD_PID" 2>/dev/null
            sleep 1
        fi
    fi

    echo "  🚀  启动后端服务器..."
    nohup npm start 2>&1 > "$PROJECT_ROOT/backend.log" &
    BACKEND_PID=$!
    echo "  ✅ 后端已启动 (PID: $BACKEND_PID)"
    echo "  🌐  后端地址: http://localhost:3000"
    echo "  📝  日志文件: $PROJECT_ROOT/backend.log"

    cd "$PROJECT_ROOT"
else
    echo "  ⚠️  未找到 backend 目录"
fi
echo ""

# ==============================================
# 2. 启动前端服务
# ==============================================
echo "[2/2] 启动 FileCloud 前端服务..."
if [ -d "$PROJECT_ROOT/frontend" ]; then
    cd "$PROJECT_ROOT/frontend"

    # 检查 node_modules 是否存在
    if [ ! -d "node_modules" ]; then
        echo "  📦  安装前端依赖..."
        npm install
    fi

    # 停止已有的前端进程
    if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
        OLD_PID=$(cat "$PROJECT_ROOT/frontend.pid")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            echo "  🛑  停止旧前端进程 (PID: $OLD_PID)..."
            kill "$OLD_PID" 2>/dev/null
            sleep 1
        fi
    fi

    echo "  🚀  启动前端开发服务器..."
    nohup npm run dev 2>&1 > "$PROJECT_ROOT/frontend.log" &
    FRONTEND_PID=$!
    echo "  ✅ 前端已启动 (PID: $FRONTEND_PID)"
    echo "  🌐  前端地址: http://localhost:5173"
    echo "  📝  日志文件: $PROJECT_ROOT/frontend.log"

    cd "$PROJECT_ROOT"
else
    echo "  ⚠️  未找到 frontend 目录"
fi
echo ""

# ==============================================
# 保存 PID 文件
# ==============================================
if [ -n "$BACKEND_PID" ]; then
    echo "$BACKEND_PID" > "$PROJECT_ROOT/backend.pid"
fi
if [ -n "$FRONTEND_PID" ]; then
    echo "$FRONTEND_PID" > "$PROJECT_ROOT/frontend.pid"
fi

# ==============================================
# 完成
# ==============================================
echo "=========================================="
echo "  ✅  前后端服务启动完成！"
echo "=========================================="
echo ""
echo "  📊  服务访问地址："
echo "  - 前端应用: http://localhost:5173"
echo "  - 后端 API: http://localhost:3000"
echo ""
echo "  📋  日志文件："
echo "  - 后端日志: $PROJECT_ROOT/backend.log"
echo "  - 前端日志: $PROJECT_ROOT/frontend.log"
echo ""
echo "  🛑  停止服务命令："
echo "  ./stop-all.sh"
echo ""
echo "=========================================="