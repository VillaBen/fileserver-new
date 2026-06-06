const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('Upgrading test user to admin...');
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
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function upgradeUser() {
  try {
    // Get current user
    const user = await getQuery(
      'SELECT * FROM accounts WHERE username = ?',
      ['test']
    );
    
    if (!user) {
      console.log('Test user not found!');
      db.close();
      return;
    }
    
    console.log('Current user:', user.username, 'Role:', user.role);
    
    // Upgrade to admin
    const result = await runQuery(
      'UPDATE accounts SET role = ? WHERE id = ?',
      ['admin', user.id]
    );
    
    console.log('Successfully upgraded test user to admin!');
    console.log('Changes:', result.changes);
    
    // Verify the change
    const updatedUser = await getQuery(
      'SELECT * FROM accounts WHERE username = ?',
      ['test']
    );
    console.log('Updated user:', updatedUser.username, 'Role:', updatedUser.role);
    
  } catch (err) {
    console.error('Error upgrading user:', err);
  } finally {
    db.close();
  }
}

upgradeUser();