
/**
 * 测试 MySQL 连接
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 测试 MySQL 连接...');
  
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'fileserver',
    connectTimeout: 5000
  };
  
  console.log('📋 配置:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL 连接成功！');
    
    // 测试查询
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`📊 MySQL 版本: ${rows[0].version}`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error.message);
    console.error('💡 提示:');
    console.error('   1. 确保 MySQL 服务正在运行');
    console.error('   2. 检查 .env 中的配置是否正确');
    console.error('   3. 确认数据库 "fileserver" 是否已创建');
    console.error('   4. 当前环境可以继续使用 SQLite (默认)');
    return false;
  }
}

testConnection();

