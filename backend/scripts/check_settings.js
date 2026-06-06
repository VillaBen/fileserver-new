const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('检查系统设置...');

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// Helper function to run queries with Promise
function getAllQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function checkSettings() {
  try {
    const settings = await getAllQuery('SELECT * FROM system_settings');
    console.log('\n📋 所有系统设置:');
    console.log('─────────────────────────');
    if (settings.length === 0) {
      console.log('⚠️ 没有找到任何设置');
    } else {
      settings.forEach(s => {
        console.log(`${s.key} = ${s.value ? '***' : '(empty)'} (Updated: ${s.updated_at})`);
      });
    }

    console.log('\n🔍 查找 malware_scan_mode:');
    const malwareMode = settings.find(s => s.key === 'malware_scan_mode');
    if (malwareMode) {
      console.log(`✅ 找到: ${malwareMode.value}`);
    } else {
      console.log('❌ 未找到 malware_scan_mode');
    }
  } catch (error) {
    console.error('Error checking settings:', error);
  } finally {
    db.close();
  }
}

checkSettings();
