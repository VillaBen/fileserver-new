const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('Checking database...');
console.log('Database path:', DB_PATH);

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database.');
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

async function checkDatabase() {
  try {
    // Check all accounts
    const accounts = await getAllQuery('SELECT * FROM accounts');
    console.log('\n=== Accounts ===');
    accounts.forEach(acc => {
      console.log(`ID: ${acc.id}, Username: ${acc.username}, Role: ${acc.role}, Status: ${acc.status}, Created: ${acc.created_at}`);
    });
    
    // Check user profiles
    const profiles = await getAllQuery('SELECT * FROM user_profiles');
    console.log('\n=== User Profiles ===');
    profiles.forEach(prof => {
      console.log(`ID: ${prof.id}, Account ID: ${prof.account_id}, Language: ${prof.language}`);
    });
    
    // Check audit logs
    const logs = await getAllQuery('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10');
    console.log('\n=== Recent Audit Logs ===');
    logs.forEach(log => {
      console.log(`[${log.created_at}] User ${log.account_id}: ${log.action}`);
    });
    
    // Check database file creation/modification time
    const fs = require('fs');
    const stats = fs.statSync(DB_PATH);
    console.log('\n=== Database File Info ===');
    console.log('Created:', stats.birthtime);
    console.log('Modified:', stats.mtime);
    console.log('Size:', stats.size, 'bytes');
    
  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    db.close();
  }
}

checkDatabase();