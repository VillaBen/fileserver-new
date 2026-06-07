
process.env.DB_TYPE = 'mysql';
process.env.MYSQL_SOCKET = '/tmp/mysql.sock';

const mysqlDb = require('./src/config/database.mysql');

async function run() {
  console.log('Initializing MySQL...');
  await mysqlDb.initDatabase();
  console.log('Done!');
  
  const conn = await mysqlDb.pool.getConnection();
  const [tables] = await conn.execute('SHOW TABLES');
  console.log('Tables created:', tables.length);
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  conn.release();
}

run().catch(console.error);

