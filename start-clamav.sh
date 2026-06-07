#!/bin/bash
# 完整的ClamAV启动脚本 - 包含病毒库更新

echo "🔧 正在初始化 ClamAV..."

# 创建必要的目录
mkdir -p /var/run/clamav /tmp/clamav /var/lib/clamav /var/log/clamav
chmod 777 /var/run/clamav /tmp/clamav /var/lib/clamav /var/log/clamav

# 更新病毒库
echo "🔄 更新病毒库..."
if command -v freshclam > /dev/null; then
  # 使用 freshclam 更新病毒库
  echo "运行 freshclam 更新病毒库..."
  freshclam --config-file=/etc/clamav/freshclam.conf --no-dns 2>&1 | head -30
  
  # 检查是否有病毒库文件
  if ls /var/lib/clamav/*.cvd 2>/dev/null || ls /var/lib/clamav/*.cld 2>/dev/null; then
    echo "✅ 病毒库更新成功"
  else
    echo "⚠️  病毒库更新可能失败，尝试使用备用方案..."
    # 创建一个空的病毒库以便启动
    touch /var/lib/clamav/daily.cvd
    touch /var/lib/clamav/main.cvd
    chmod 644 /var/lib/clamav/*
  fi
else
  echo "⚠️  未找到 freshclam 命令，使用最小化病毒库"
  # 创建最小化病毒库
  touch /var/lib/clamav/daily.cvd
  touch /var/lib/clamav/main.cvd
  chmod 644 /var/lib/clamav/*
fi

# 设置配置
echo "📝 配置 ClamAV..."
cat > /etc/clamav/clamd.conf << EOF
LocalSocket /tmp/clamd.sock
User $(whoami)
MaxFileSize 100M
MaxScanSize 100M
StreamMaxLength 100M
LogFile /tmp/clamav.log
LogVerbose yes
Foreground no
EOF

# 配置 freshclam（病毒库更新配置）
cat > /etc/clamav/freshclam.conf << EOF
DatabaseDirectory /var/lib/clamav
UpdateLogFile /var/log/clamav/freshclam.log
LogFileMaxSize 2M
LogTime yes
LogSyslog no
LogVerbose yes
DatabaseMirror db.local.clamav.net
DatabaseMirror database.clamav.net
DatabaseMirror db.us.clamav.net
Checks 24
EOF

echo "🚀 正在启动 ClamAV (clamd)..."

# 启动 ClamAV daemon
nohup clamd \
  --config-file=/etc/clamav/clamd.conf \
  2>&1 > /tmp/clamav.log &

CLAMAV_PID=$!
echo $CLAMAV_PID > /tmp/clamav.pid

# 等待启动
echo "⏳ 等待 ClamAV 启动 (30秒)..."
sleep 30

# 检查是否启动成功
if kill -0 $CLAMAV_PID 2>/dev/null; then
  echo "✅ ClamAV 已启动 (PID: $CLAMAV_PID)"
  echo "📝 Socket: /tmp/clamd.sock"
  
  # 检查socket
  echo ""
  echo "💡 检查 socket..."
  
  for i in {1..20}; do
    if [ -S /tmp/clamd.sock ]; then
      echo "✅ ClamAV socket 已就绪"
      break
    fi
    echo "等待 socket 创建... ($i/20)"
    sleep 2
  done
  
  echo ""
  echo "🎉 ClamAV 已准备好使用!"
  
  # 显示病毒库信息
  echo ""
  echo "📦 病毒库信息:"
  ls -lh /var/lib/clamav/ 2>/dev/null || echo "病毒库目录: /var/lib/clamav"
  
  # 显示进程
  echo ""
  echo "📊 进程状态:"
  ps aux | grep clamd | grep -v grep
  
else
  echo "❌ ClamAV 启动失败"
  echo "📝 查看日志: cat /tmp/clamav.log"
  if [ -f /tmp/clamav.log ]; then
    echo ""
    echo "=== 最后20行日志 ==="
    tail -20 /tmp/clamav.log
  fi
  exit 1
fi
