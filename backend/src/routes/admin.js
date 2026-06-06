// src/routes/admin.js
const express = require('express');
const adminController = require('../controllers/AdminController');
const systemSettingsController = require('../controllers/SystemSettingsController');

const router = express.Router();

// 仪表盘统计
router.get('/dashboard', adminController.getDashboardStats);

// 用户管理
router.get('/users', adminController.getAllUsers);
router.get('/users/:accountId', adminController.getUserDetails);
router.put('/users/:accountId/role', adminController.updateUserRole);
router.put('/users/:accountId/status', adminController.updateUserStatus);
router.put('/users/:accountId/quota', adminController.updateUserQuota);
router.delete('/users/:accountId', adminController.deleteUser);

// 审计日志
router.get('/audit-logs', adminController.getAuditLogs);

// 文件管理
router.get('/files', adminController.getAllFiles);

// 系统设置（需要管理员权限）
router.get('/settings', systemSettingsController.getSettings);
router.put('/settings', systemSettingsController.updateSettings);

// 安全设置
router.get('/security-settings', systemSettingsController.getSettings);

// 邮件配置测试
router.post('/settings/test-smtp', systemSettingsController.testSmtp);
router.post('/settings/send-test-email', systemSettingsController.sendTestEmail);

module.exports = router;
