#!/bin/bash

# ==============================================
# FileCloud 服务统一启动脚本
# 包含：MySQL、ClamAV、后端API、前端
# ==============================================

echo "=========================================="
echo "  🚀  FileCloud 服务启动脚本"
echo "=========================================="
echo ""

# 项目根目录
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$PROJECT_ROOT"

# ==============================================
# 1. 启动 MySQL
# ==============================================
echo "[1/5] 启动 MySQL 服务..."
if [ -f "$PROJECT_ROOT/start-mysql.sh" ]; then
    chmod +x "$PROJECT_ROOT/start-mysql.sh"
    "$PROJECT_ROOT/start-mysql.sh"
else
    echo "  ℹ️  使用系统 MySQL..."
    if command -v mysql &> /dev/null; then
        # 检查 MySQL 是否已运行
        if mysqladmin ping -h 127.0.0.1 --silent; then
            echo "  ✅ MySQL 已在运行"
        else
            echo "  🛠️  尝试启动 MySQL..."
            if command -v mysqld &> /dev/null; then
                nohup mysqld --datadir=/tmp/mysql/data --socket=/tmp/mysql.sock --port=3306 2>&1 > /tmp/mysql.log &
                MYSQL_PID=$!
                echo "  ✅ MySQL 启动中 (PID: $MYSQL_PID)"
                sleep 3
            else
                echo "  ⚠️  找不到 mysqld，MySQL 可能需要手动配置"
            fi
        fi
    else
        echo "  ⚠️  未找到 MySQL 命令，跳过"
    fi
fi
echo ""

# ==============================================
# 2. 启动 ClamAV
# ==============================================
echo "[2/5] 启动 ClamAV 反病毒服务..."
if [ -f "$PROJECT_ROOT/start-clamav.sh" ]; then
    chmod +x "$PROJECT_ROOT/start-clamav.sh"
    "$PROJECT_ROOT/start-clamav.sh"
else
    echo "  ℹ️  使用系统 ClamAV..."
    if command -v clamd &> /dev/null; then
        # 尝试启动 clamd
        if pgrep -x "clamd" > /dev/null; then
            echo "  ✅ ClamAV 已在运行"
        else
            echo "  🛠️  尝试启动 ClamAV..."
            mkdir -p /tmp/clamav
            chmod 777 /tmp/clamav
            nohup clamd --config-file=/etc/clamav/clamd.conf 2>&1 > /tmp/clamav.log &
            CLAMAV_PID=$!
            echo "  ✅ ClamAV 启动中 (PID: $CLAMAV_PID)"
            sleep 2
        fi
    else
        echo "  ⚠️  未找到 ClamAV，跳过"
    fi
fi
echo ""

# ==============================================
# 3. 启动后端服务
# ==============================================
echo "[3/5] 启动 FileCloud 后端服务..."
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
        node scripts/init-db.js
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
# 4. 启动前端服务
# ==============================================
echo "[4/5] 启动 FileCloud 前端服务..."
if [ -d "$PROJECT_ROOT/frontend" ]; then
    cd "$PROJECT_ROOT/frontend"
    
    # 检查 node_modules 是否存在
    if [ ! -d "node_modules" ]; then
        echo "  📦  安装前端依赖..."
        npm install
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
# 5. 保存 PID 文件
# ==============================================
echo "[5/5] 保存进程信息..."
if [ -n "$MYSQL_PID" ]; then
    echo "$MYSQL_PID" > "$PROJECT_ROOT/mysql.pid"
fi
if [ -n "$CLAMAV_PID" ]; then
    echo "$CLAMAV_PID" > "$PROJECT_ROOT/clamav.pid"
fi
if [ -n "$BACKEND_PID" ]; then
    echo "$BACKEND_PID" > "$PROJECT_ROOT/backend.pid"
fi
if [ -n "$FRONTEND_PID" ]; then
    echo "$FRONTEND_PID" > "$PROJECT_ROOT/frontend.pid"
fi
echo "  ✅ 进程信息已保存"
echo ""

# ==============================================
# 完成
# ==============================================
echo "=========================================="
echo "  ✅  所有服务启动完成！"
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
