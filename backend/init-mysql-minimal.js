
process.env.DB_TYPE = 'mysql';
process.env.MYSQL_SOCKET = '/tmp/mysql.sock';

const mysqlDb = require('./src/config/database.mysql');

async function run() {
  console.log('Initializing MySQL...');
  await mysqlDb.initDatabase();
  console.log('Done!');
}

run().catch(function(e) {
  console.error(e);
  process.exit(1);
});

