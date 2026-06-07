
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
    socketPath: '/tmp/mysql.sock', // 使用 socket 连接
    connectTimeout: 10000
  };
  
  console.log('📋 配置:');
  console.log(`   Socket: ${config.socketPath}`);
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
    
    // 查看数据库
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log(`📚 数据库列表:`);
    databases.forEach(db => console.log(`   - ${db.Database}`));
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error.message);
    return false;
  }
}

testConnection();

