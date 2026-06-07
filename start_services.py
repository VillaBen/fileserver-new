#!/usr/bin/env python3
import subprocess
import time
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent

def print_status(message, status="info"):
    colors = {
        "info": "\033[94m",
        "success": "\033[92m",
        "warning": "\033[93m",
        "error": "\033[91m",
        "reset": "\033[0m"
    }
    prefix = {
        "info": "ℹ️ ",
        "success": "✅ ",
        "warning": "⚠️ ",
        "error": "❌ "
    }
    print(f"{colors[status]}{prefix[status]}{message}{colors['reset']}")

def run_command(cmd, cwd=None, check=False, timeout=None):
    print_status(f"执行: {cmd}", "info")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(f"STDERR: {result.stderr.strip()}")
        if check:
            result.check_returncode()
        return result.returncode == 0
    except Exception as e:
        print_status(f"命令失败: {e}", "error")
        return False

def kill_port(port):
    print_status(f"清理端口 {port}...", "info")
    run_command(f"lsof -ti:{port} | xargs kill -9 2>/dev/null || true")

def check_service(name, cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except:
        return False

def start_mysql():
    print_status("启动 MySQL...", "info")
    
    # 确保目录存在
    os.makedirs("/var/run/mysqld", exist_ok=True)
    run_command("chown mysql:mysql /var/run/mysqld 2>/dev/null || true")
    
    # 初始化数据库（如果未初始化）
    if not os.path.exists("/var/lib/mysql/mysql"):
        print_status("初始化 MySQL 数据库...", "info")
        run_command("mysqld --initialize-insecure --datadir=/var/lib/mysql --user=mysql")
    
    # 启动 MySQL
    kill_port(3306)
    mysql_cmd = "nohup mysqld --datadir=/var/lib/mysql --user=mysql --socket=/var/run/mysqld/mysqld.sock > /tmp/mysql.log 2>&1 &"
    run_command(mysql_cmd)
    
    # 等待启动
    print_status("等待 MySQL 启动...", "info")
    for i in range(30):
        if check_service("MySQL", "mysqladmin -u root ping 2>/dev/null"):
            print_status("MySQL 已启动", "success")
            # 创建数据库
            run_command("mysql -u root -e \"CREATE DATABASE IF NOT EXISTS fileserver;\"")
            return True
        time.sleep(1)
    print_status("MySQL 启动超时", "error")
    return False

def start_clamav():
    print_status("启动 ClamAV...", "info")
    
    # 确保权限
    run_command("chown -R clamav:clamav /var/lib/clamav 2>/dev/null || true")
    
    # 启动 clamd
    clamav_cmd = "nohup clamd > /tmp/clamd.log 2>&1 &"
    run_command(clamav_cmd)
    
    # 等待启动
    print_status("等待 ClamAV 启动...", "info")
    for i in range(30):
        if check_service("ClamAV", "clamdscan --version 2>/dev/null"):
            print_status("ClamAV 已启动", "success")
            return True
        time.sleep(1)
    print_status("ClamAV 启动超时", "warning")
    return False

def start_backend():
    print_status("启动后端服务器...", "info")
    kill_port(3000)
    
    backend_dir = PROJECT_ROOT / "backend"
    if not (backend_dir / "node_modules").exists():
        print_status("安装后端依赖...", "info")
        run_command("npm install", cwd=backend_dir)
    
    backend_cmd = "nohup npm start > /tmp/backend.log 2>&1 &"
    run_command(backend_cmd, cwd=backend_dir)
    
    # 等待启动
    print_status("等待后端启动...", "info")
    for i in range(30):
        if check_service("Backend", "curl -s http://localhost:3000/api/health >/dev/null 2>&1"):
            print_status("后端已启动: http://localhost:3000", "success")
            return True
        time.sleep(1)
    print_status("后端启动超时", "error")
    return False

def start_frontend():
    print_status("启动前端服务器...", "info")
    kill_port(5173)
    
    frontend_dir = PROJECT_ROOT / "frontend"
    if not (frontend_dir / "node_modules").exists():
        print_status("安装前端依赖...", "info")
        run_command("npm install", cwd=frontend_dir)
    
    frontend_cmd = "nohup npm run dev -- --host > /tmp/frontend.log 2>&1 &"
    run_command(frontend_cmd, cwd=frontend_dir)
    
    # 等待启动
    print_status("等待前端启动...", "info")
    for i in range(30):
        if check_service("Frontend", "curl -s http://localhost:5173 >/dev/null 2>&1"):
            print_status("前端已启动: http://localhost:5173", "success")
            return True
        time.sleep(1)
    print_status("前端启动超时", "error")
    return False

def main():
    print_status("=" * 50, "info")
    print_status("FileCloud 服务启动脚本", "info")
    print_status("=" * 50, "info")
    
    # 检查项目目录
    if not (PROJECT_ROOT / "backend").exists() or not (PROJECT_ROOT / "frontend").exists():
        print_status("请在项目根目录运行此脚本", "error")
        return 1
    
    # 启动服务
    start_mysql()
    start_clamav()
    start_backend()
    start_frontend()
    
    print_status("=" * 50, "success")
    print_status("所有服务启动完成！", "success")
    print_status("前端: http://localhost:5173", "info")
    print_status("后端: http://localhost:3000", "info")
    print_status("查看日志: tail -f /tmp/{backend,frontend,mysql,clamd}.log", "info")
    print_status("=" * 50, "success")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())