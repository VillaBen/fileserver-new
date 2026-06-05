#!/usr/bin/env node
// 数据库迁移脚本：添加 deleted_at 和 type 字段
require('dotenv').config();
const { db } = require('../src/config/database');

async function migrate() {
  try {
    console.log('🔧 正在执行数据库迁移...');
    
    // 检查并添加 deleted_at 字段
    const columns = await db.asyncAll("PRAGMA table_info(files)");
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('deleted_at')) {
      await db.asyncRun('ALTER TABLE files ADD COLUMN deleted_at DATETIME');
      console.log('✅ 已添加 deleted_at 字段');
    } else {
      console.log('ℹ️  deleted_at 字段已存在');
    }
    
    // 检查并添加 type 字段
    if (!columnNames.includes('type')) {
      await db.asyncRun('ALTER TABLE files ADD COLUMN type TEXT');
      console.log('✅ 已添加 type 字段');
    } else {
      console.log('ℹ️  type 字段已存在');
    }
    
    console.log('✅ 数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
