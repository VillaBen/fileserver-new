const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { decrypt } = require('../src/utils/encryption');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('测试加密数据...');

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
    console.log('\n🔍 检查设置是否被错误加密:');
    console.log('─────────────────────────');
    
    for (const s of settings) {
      try {
        const decrypted = decrypt(s.value);
        console.log(`${s.key} = 原始:"${s.value}" → 解密:"${decrypted}"`);
        
        if (decrypted && decrypted !== s.value) {
          console.log(`  ⚠️  这条数据被加密了!`);
        }
      } catch (e) {
        console.log(`${s.key} = "${s.value}" (解密失败: ${e.message})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

main();
