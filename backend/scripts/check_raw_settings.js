const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('检查系统设置（原始值）...');

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

async function checkSettings() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM system_settings', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function main() {
  try {
    const settings = await checkSettings();
    console.log('\n📋 所有系统设置（原始值）:');
    console.log('─────────────────────────');
    settings.forEach(s => {
      console.log(`${s.key} = "${s.value}" (Updated: ${s.updated_at})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

main();
