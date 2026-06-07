
/**
 * 数据迁移脚本 - 从 SQLite 迁移到 MySQL
 */

const sqliteDb = require('../src/config/database');
const mysqlDb = require('../src/config/database.mysql');

async function migrateData() {
  console.log('🚀 开始数据迁移 (SQLite -> MySQL)...');

  try {
    // 测试 MySQL 连接
    console.log('📡 测试 MySQL 连接...');
    const mysqlConnected = await mysqlDb.testConnection();
    if (!mysqlConnected) {
      console.error('❌ MySQL 连接失败，请检查配置');
      process.exit(1);
    }

    // 初始化 MySQL 表结构
    console.log('📦 初始化 MySQL 表结构...');
    await mysqlDb.initDatabase();

    // 开始迁移数据
    console.log('📊 开始迁移数据...');

    // 1. 迁移 accounts 表
    console.log('  ↪️ 迁移 accounts 表...');
    const accounts = await sqliteDb.db.asyncAll('SELECT * FROM accounts');
    for (const account of accounts) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO accounts (id, username, email, password_hash, role, status, storage_quota, avatar, two_factor_enabled, two_factor_secret, failed_login_attempts, locked_until, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        account.id,
        account.username,
        account.email,
        account.password_hash,
        account.role,
        account.status,
        account.storage_quota,
        account.avatar,
        account.two_factor_enabled,
        account.two_factor_secret,
        account.failed_login_attempts,
        account.locked_until,
        account.created_at,
        account.updated_at
      ]);
    }
    console.log(`     ✅ ${accounts.length} 条记录`);

    // 2. 迁移 user_profiles 表
    console.log('  ↪️ 迁移 user_profiles 表...');
    const userProfiles = await sqliteDb.db.asyncAll('SELECT * FROM user_profiles');
    for (const profile of userProfiles) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO user_profiles (id, account_id, storage_quota, language, avatar, security_question, security_answer_hash, two_factor_enabled, two_factor_secret, email_verified, email_verification_token, email_reminder_disabled, trash_auto_delete_enabled, trash_auto_delete_days, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        profile.id,
        profile.account_id,
        profile.storage_quota,
        profile.language,
        profile.avatar,
        profile.security_question,
        profile.security_answer_hash,
        profile.two_factor_enabled,
        profile.two_factor_secret,
        profile.email_verified,
        profile.email_verification_token,
        profile.email_reminder_disabled,
        profile.trash_auto_delete_enabled,
        profile.trash_auto_delete_days,
        profile.created_at,
        profile.updated_at
      ]);
    }
    console.log(`     ✅ ${userProfiles.length} 条记录`);

    // 3. 迁移 api_tokens 表
    console.log('  ↪️ 迁移 api_tokens 表...');
    const apiTokens = await sqliteDb.db.asyncAll('SELECT * FROM api_tokens');
    for (const token of apiTokens) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO api_tokens (id, account_id, token, name, permissions, last_used_at, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        token.id,
        token.account_id,
        token.token,
        token.name,
        token.permissions,
        token.last_used_at,
        token.expires_at,
        token.created_at
      ]);
    }
    console.log(`     ✅ ${apiTokens.length} 条记录`);

    // 4. 迁移 files 表
    console.log('  ↪️ 迁移 files 表...');
    const files = await sqliteDb.db.asyncAll('SELECT * FROM files');
    for (const file of files) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO files (id, account_id, original_name, filename, filepath, size, mime_type, folder_id, in_trash, is_encrypted, file_hash, security_status, scan_mode, scan_result, scan_at, deleted_at, type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        file.id,
        file.account_id,
        file.original_name,
        file.filename,
        file.filepath,
        file.size,
        file.mime_type,
        file.folder_id,
        file.in_trash,
        file.is_encrypted,
        file.file_hash,
        file.security_status,
        file.scan_mode,
        file.scan_result,
        file.scan_at,
        file.deleted_at,
        file.type,
        file.created_at,
        file.updated_at
      ]);
    }
    console.log(`     ✅ ${files.length} 条记录`);

    // 5. 迁移 shares 表
    console.log('  ↪️ 迁移 shares 表...');
    const shares = await sqliteDb.db.asyncAll('SELECT * FROM shares');
    for (const share of shares) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO shares (id, file_id, account_id, share_code, password_hash, expires_at, max_downloads, download_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        share.id,
        share.file_id,
        share.account_id,
        share.share_code,
        share.password_hash,
        share.expires_at,
        share.max_downloads,
        share.download_count,
        share.created_at
      ]);
    }
    console.log(`     ✅ ${shares.length} 条记录`);

    // 6. 迁移 audit_logs 表
    console.log('  ↪️ 迁移 audit_logs 表...');
    const auditLogs = await sqliteDb.db.asyncAll('SELECT * FROM audit_logs');
    for (const log of auditLogs) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO audit_logs (id, account_id, action, ip_address, user_agent, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        log.id,
        log.account_id,
        log.action,
        log.ip_address,
        log.user_agent,
        log.details,
        log.created_at
      ]);
    }
    console.log(`     ✅ ${auditLogs.length} 条记录`);

    // 7. 迁移 recovery_codes 表
    console.log('  ↪️ 迁移 recovery_codes 表...');
    const recoveryCodes = await sqliteDb.db.asyncAll('SELECT * FROM recovery_codes');
    for (const code of recoveryCodes) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO recovery_codes (id, account_id, code, used, used_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        code.id,
        code.account_id,
        code.code,
        code.used,
        code.used_at,
        code.created_at
      ]);
    }
    console.log(`     ✅ ${recoveryCodes.length} 条记录`);

    // 8. 迁移 email_codes 表
    console.log('  ↪️ 迁移 email_codes 表...');
    const emailCodes = await sqliteDb.db.asyncAll('SELECT * FROM email_codes');
    for (const code of emailCodes) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO email_codes (id, email, purpose, code, expires_at, attempts, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        code.id,
        code.email,
        code.purpose,
        code.code,
        code.expires_at,
        code.attempts,
        code.created_at
      ]);
    }
    console.log(`     ✅ ${emailCodes.length} 条记录`);

    // 9. 迁移 password_resets 表
    console.log('  ↪️ 迁移 password_resets 表...');
    const passwordResets = await sqliteDb.db.asyncAll('SELECT * FROM password_resets');
    for (const reset of passwordResets) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO password_resets (id, account_id, token, expires_at, used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        reset.id,
        reset.account_id,
        reset.token,
        reset.expires_at,
        reset.used,
        reset.created_at
      ]);
    }
    console.log(`     ✅ ${passwordResets.length} 条记录`);

    // 10. 迁移 system_settings 表
    console.log('  ↪️ 迁移 system_settings 表...');
    const systemSettings = await sqliteDb.db.asyncAll('SELECT * FROM system_settings');
    for (const setting of systemSettings) {
      await mysqlDb.db.asyncRun(`
        INSERT INTO system_settings (id, \`key\`, value, updated_at)
        VALUES (?, ?, ?, ?)
      `, [
        setting.id,
        setting.key,
        setting.value,
        setting.updated_at
      ]);
    }
    console.log(`     ✅ ${systemSettings.length} 条记录`);

    console.log('\n✅ 数据迁移完成！');
    console.log('📊 迁移统计:');
    console.log(`  - accounts: ${accounts.length}`);
    console.log(`  - user_profiles: ${userProfiles.length}`);
    console.log(`  - api_tokens: ${apiTokens.length}`);
    console.log(`  - files: ${files.length}`);
    console.log(`  - shares: ${shares.length}`);
    console.log(`  - audit_logs: ${auditLogs.length}`);
    console.log(`  - recovery_codes: ${recoveryCodes.length}`);
    console.log(`  - email_codes: ${emailCodes.length}`);
    console.log(`  - password_resets: ${passwordResets.length}`);
    console.log(`  - system_settings: ${systemSettings.length}`);

  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
migrateData();

