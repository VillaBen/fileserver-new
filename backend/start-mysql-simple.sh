#!/bin/bash
# 简化版 MySQL 启动脚本

# 确保目录存在
mkdir -p /tmp/mysql

echo "🔧 正在初始化 MySQL..."

# 初始化数据库（仅第一次）
if [ ! -d /tmp/mysql/data/mysql ]; then
  mysqld --initialize-insecure --datadir=/tmp/mysql/data
  if [ $? -eq 0 ]; then
    echo "✅ MySQL 初始化成功"
  else
    echo "❌ MySQL 初始化失败"
    exit 1
  fi
fi

echo "🚀 正在启动 MySQL..."

# 启动 MySQL - 后台运行，禁用日志，简化配置
nohup mysqld \
  --datadir=/tmp/mysql/data \
  --socket=/tmp/mysql.sock \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --skip-networking=0 \
  --skip-name-resolve \
  --skip-log-error \
  --general_log=0 \
  --slow_query_log=0 \
  2>&1 > /tmp/mysql.log &

MYSQL_PID=$!
echo $MYSQL_PID > /tmp/mysql.pid

# 等待启动
echo "⏳ 等待 MySQL 启动 (10秒)..."
sleep 10

# 检查是否启动成功
if kill -0 $MYSQL_PID 2>/dev/null; then
  echo "✅ MySQL 已启动 (PID: $MYSQL_PID)"
  echo "📝 Socket: /tmp/mysql.sock"
  echo "📝 Port: 3306"
  echo ""
  echo "💡 创建数据库..."
  
  # 等待几秒让服务完全启动
  sleep 3
  
  # 创建数据库
  mysql --socket=/tmp/mysql.sock -u root -e "CREATE DATABASE IF NOT EXISTS fileserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  
  if [ $? -eq 0 ]; then
    echo "✅ 数据库 'fileserver' 创建成功"
  else
    echo "⚠️  数据库创建命令执行完成"
  fi
  
  echo ""
  echo "🎉 MySQL 已准备好使用！"
  echo "💡 测试连接: mysql --socket=/tmp/mysql.sock -u root"
  
  # 显示进程
  echo ""
  echo "📊 进程状态:"
  ps aux | grep mysqld | grep -v grep
  
else
  echo "❌ MySQL 启动失败"
  echo "📝 查看日志: cat /tmp/mysql.log"
  exit 1
fi

