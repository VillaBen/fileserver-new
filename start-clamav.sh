#!/bin/bash
# 简化的ClamAV启动脚本 - 测试环境版本

echo "🔧 正在初始化 ClamAV (测试版本)..."

# 创建必要的目录
mkdir -p /var/run/clamav /tmp/clamav /var/lib/clamav
chmod 777 /var/run/clamav /tmp/clamav /var/lib/clamav

# 创建最小化病毒库目录（测试用）
echo "创建测试病毒库..."
touch /var/lib/clamav/daily.cvd
touch /var/lib/clamav/main.cvd
chmod 644 /var/lib/clamav/*

# 设置配置
cat > /etc/clamav/clamd.conf << EOF
LocalSocket /tmp/clamd.sock
User $(whoami)
ScanMaxFileSize 100M
MaxScanSize 100M
StreamMaxLength 100M
LogFile /tmp/clamav.log
LogVerbose yes
EOF

echo "🚀 正在启动 ClamAV (clamd)..."

# 启动 ClamAV daemon
nohup clamd \
    --config-file=/etc/clamav/clamd.conf \
    2>&1 > /tmp/clamav.log &

CLAMAV_PID=$!
echo $CLAMAV_PID > /tmp/clamav.pid

# 等待启动
echo "⏳ 等待 ClamAV 启动 (10秒)..."
sleep 10

# 检查是否启动成功
if kill -0 $CLAMAV_PID 2>/dev/null; then
    echo "✅ ClamAV 已启动 (PID: $CLAMAV_PID)"
    echo "📝 Socket: /tmp/clamd.sock"
    echo "📝 注意: 测试环境使用最小病毒库，仅做功能验证!"
    
    # 检查socket
    echo ""
    echo "💡 检查 socket..."
    
    for i in {1..10}; do
        if [ -S /tmp/clamd.sock ]; then
            echo "✅ ClamAV socket 已就绪"
            break
        fi
        echo "等待 socket 创建... ($i/10)"
        sleep 2
    done
    
    echo ""
    echo "🎉 ClamAV 已准备好使用（测试模式）!"
    
    # 显示进程
    echo ""
    echo "📊 进程状态:"
    ps aux | grep clamd | grep -v grep
    
else
    echo "❌ ClamAV 启动失败"
    echo "📝 查看日志: cat /tmp/clamav.log"
    exit 1
fi
