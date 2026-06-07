#!/bin/bash
# 简单的 MySQL 启动脚本

# 创建必要的目录
mkdir -p /tmp/mysql/data
mkdir -p /tmp/mysql/run
mkdir -p /tmp/mysql/log

# 设置权限
chmod 755 /tmp/mysql
chmod 755 /tmp/mysql/data
chmod 755 /tmp/mysql/run
chmod 755 /tmp/mysql/log

echo "🔧 正在初始化 MySQL..."

# 初始化数据库（仅第一次）
if [ ! -f /tmp/mysql/data/mysql/user.frm ] && [ ! -f /tmp/mysql/data/mysql/user.MYD ]; then
  mysqld --initialize-insecure --datadir=/tmp/mysql/data --user=$(whoami)
  if [ $? -eq 0 ]; then
    echo "✅ MySQL 初始化成功"
  else
    echo "❌ MySQL 初始化失败"
    exit 1
  fi
fi

echo "🚀 正在启动 MySQL..."

# 启动 MySQL
mysqld \
  --datadir=/tmp/mysql/data \
  --socket=/tmp/mysql/run/mysqld.sock \
  --pid-file=/tmp/mysql/run/mysqld.pid \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --skip-networking=0 \
  --skip-name-resolve \
  --general_log=0 \
  --slow_query_log=0 \
  --log-error=/tmp/mysql/log/error.log \
  --user=$(whoami) &

MYSQL_PID=$!
echo $MYSQL_PID > /tmp/mysql/run/mysqld.pid

# 等待启动
echo "⏳ 等待 MySQL 启动..."
sleep 5

# 检查是否启动成功
if kill -0 $MYSQL_PID 2>/dev/null; then
  echo "✅ MySQL 已启动 (PID: $MYSQL_PID)"
  echo "📝 Socket: /tmp/mysql/run/mysqld.sock"
  echo "📝 Port: 3306"
  echo ""
  echo "💡 创建数据库..."
  
  # 等待几秒让服务完全启动
  sleep 3
  
  # 创建数据库
  mysql --socket=/tmp/mysql/run/mysqld.sock -u root -e "CREATE DATABASE IF NOT EXISTS fileserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ 数据库 'fileserver' 创建成功"
  else
    echo "⚠️  数据库创建可能失败，但服务已运行"
  fi
  
  echo ""
  echo "🎉 MySQL 已准备好使用！"
  echo "💡 测试连接: mysql --socket=/tmp/mysql/run/mysqld.sock -u root"
else
  echo "❌ MySQL 启动失败"
  echo "📝 查看日志: tail -f /tmp/mysql/log/error.log"
  exit 1
fi

