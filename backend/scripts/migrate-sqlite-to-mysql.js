
const sqliteDb = require('../src/config/database');
const mysqlDb = require('../src/config/database.mysql');

function toDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    return new Date(val).toISOString().slice(0, 19).replace('T', ' ');
  }
  return val;
}

async function migrate() {
  console.log('Start migration...');
  
  await mysqlDb.testConnection();
  await mysqlDb.initDatabase();
  
  console.log('Migrating accounts...');
  const accounts = await sqliteDb.db.asyncAll('SELECT * FROM accounts');
  for (let i = 0; i &lt; accounts.length; i++) {
    const a = accounts[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO accounts (id, username, email, password_hash, role, status, storage_quota, avatar, two_factor_enabled, two_factor_secret, failed_login_attempts, locked_until, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [a.id, a.username, a.email, a.password_hash, a.role, a.status, a.storage_quota, a.avatar, a.two_factor_enabled, a.two_factor_secret, a.failed_login_attempts, toDate(a.locked_until), toDate(a.created_at), toDate(a.updated_at)]
    );
  }
  console.log('OK:', accounts.length);
  
  console.log('Migrating user_profiles...');
  const profiles = await sqliteDb.db.asyncAll('SELECT * FROM user_profiles');
  for (let i = 0; i &lt; profiles.length; i++) {
    const p = profiles[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO user_profiles (id, account_id, storage_quota, language, avatar, security_question, security_answer_hash, two_factor_enabled, two_factor_secret, email_verified, email_verification_token, email_reminder_disabled, trash_auto_delete_enabled, trash_auto_delete_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.account_id, p.storage_quota, p.language, p.avatar, p.security_question, p.security_answer_hash, p.two_factor_enabled, p.two_factor_secret, p.email_verified, p.email_verification_token, p.email_reminder_disabled, p.trash_auto_delete_enabled, p.trash_auto_delete_days, toDate(p.created_at), toDate(p.updated_at)]
    );
  }
  console.log('OK:', profiles.length);
  
  console.log('Migrating files...');
  const files = await sqliteDb.db.asyncAll('SELECT * FROM files');
  for (let i = 0; i &lt; files.length; i++) {
    const f = files[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO files (id, account_id, original_name, filename, filepath, size, mime_type, folder_id, in_trash, is_encrypted, file_hash, security_status, scan_mode, scan_result, scan_at, deleted_at, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [f.id, f.account_id, f.original_name, f.filename, f.filepath, f.size, f.mime_type, f.folder_id, f.in_trash, f.is_encrypted, f.file_hash, f.security_status, f.scan_mode, f.scan_result, toDate(f.scan_at), toDate(f.deleted_at), f.type, toDate(f.created_at), toDate(f.updated_at)]
    );
  }
  console.log('OK:', files.length);
  
  console.log('Migrating shares...');
  const shares = await sqliteDb.db.asyncAll('SELECT * FROM shares');
  for (let i = 0; i &lt; shares.length; i++) {
    const s = shares[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO shares (id, file_id, account_id, share_code, password_hash, expires_at, max_downloads, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.file_id, s.account_id, s.share_code, s.password_hash, toDate(s.expires_at), s.max_downloads, s.download_count, toDate(s.created_at)]
    );
  }
  console.log('OK:', shares.length);
  
  console.log('Migrating audit_logs...');
  const logs = await sqliteDb.db.asyncAll('SELECT * FROM audit_logs');
  for (let i = 0; i &lt; logs.length; i++) {
    const l = logs[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO audit_logs (id, account_id, action, ip_address, user_agent, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [l.id, l.account_id, l.action, l.ip_address, l.user_agent, l.details, toDate(l.created_at)]
    );
  }
  console.log('OK:', logs.length);
  
  console.log('Migrating recovery_codes...');
  const codes = await sqliteDb.db.asyncAll('SELECT * FROM recovery_codes');
  for (let i = 0; i &lt; codes.length; i++) {
    const c = codes[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO recovery_codes (id, account_id, code, used, used_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, c.account_id, c.code, c.used, toDate(c.used_at), toDate(c.created_at)]
    );
  }
  console.log('OK:', codes.length);
  
  console.log('Migrating email_codes...');
  const ec = await sqliteDb.db.asyncAll('SELECT * FROM email_codes');
  for (let i = 0; i &lt; ec.length; i++) {
    const e = ec[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO email_codes (id, email, purpose, code, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [e.id, e.email, e.purpose, e.code, toDate(e.expires_at), e.attempts, toDate(e.created_at)]
    );
  }
  console.log('OK:', ec.length);
  
  console.log('Migrating password_resets...');
  const pr = await sqliteDb.db.asyncAll('SELECT * FROM password_resets');
  for (let i = 0; i &lt; pr.length; i++) {
    const p = pr[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO password_resets (id, account_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [p.id, p.account_id, p.token, toDate(p.expires_at), p.used, toDate(p.created_at)]
    );
  }
  console.log('OK:', pr.length);
  
  console.log('Migrating system_settings...');
  const ss = await sqliteDb.db.asyncAll('SELECT * FROM system_settings');
  for (let i = 0; i &lt; ss.length; i++) {
    const s = ss[i];
    await mysqlDb.db.asyncRun(
      'INSERT INTO system_settings (id, `key`, value, updated_at) VALUES (?, ?, ?, ?)',
      [s.id, s.key, s.value, toDate(s.updated_at)]
    );
  }
  console.log('OK:', ss.length);
  
  console.log('Done!');
}

migrate().catch(function(e) { console.error(e); process.exit(1); });

