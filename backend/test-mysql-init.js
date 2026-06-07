
/**
 * 测试 MySQL 数据库初始化
 */
process.env.DB_TYPE = 'mysql';
process.env.MYSQL_SOCKET = '/tmp/mysql.sock';

const { db, initDatabase } = require('./src/config/database.mysql');

async function test() {
  console.log('🚀 开始测试 MySQL 初始化...');
  
  try {
    await initDatabase();
    console.log('✅ 数据库初始化成功！');
    
    // 测试查询表
    const [tables] = await db.asyncAll('SHOW TABLES');
    console.log(`\n📊 已创建的表 (${tables.length}):`);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
}

test();

