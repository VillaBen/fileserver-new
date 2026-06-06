const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database file path
const DB_PATH = path.join(__dirname, '../database/fileserver.db');

console.log('Initializing test user...');
console.log('Database path:', DB_PATH);

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database.');
});

// Encryption implementation matching the real one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-byte-key-for-filecloud';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

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

async function initTestUser() {
  try {
    // Check if user already exists
    const existingUser = await getQuery(
      'SELECT id, username FROM accounts WHERE username = ?',
      ['test']
    );
    
    if (existingUser) {
      console.log('Test user already exists.');
      console.log('Username: test');
      console.log('Password: test123');
      db.close();
      return;
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 12); // 12 rounds matches backend
    const encryptedEmail = encrypt('test@example.com');
    
    const result = await runQuery(
      'INSERT INTO accounts (username, email, password_hash, role, status, storage_quota) VALUES (?, ?, ?, ?, ?, ?)',
      ['test', encryptedEmail, hashedPassword, 'user', 1, 10737418240] // 10 GB
    );
    
    const userId = result.lastID;
    console.log('Created test user with ID:', userId);
    
    // Create user profile
    await runQuery(
      'INSERT INTO user_profiles (account_id, storage_quota, language) VALUES (?, ?, ?)',
      [userId, 10737418240, 'en-US']
    );
    
    console.log('Test user created successfully!');
    console.log('Username: test');
    console.log('Password: test123');
    console.log('Email: test@example.com');
    
  } catch (err) {
    console.error('Error initializing test user:', err);
  } finally {
    db.close();
  }
}

// Create test user as admin (optional upgrade later)
initTestUser();