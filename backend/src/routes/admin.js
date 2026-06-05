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

// 系统设置
router.get('/settings', systemSettingsController.getSettings);
router.put('/settings', systemSettingsController.updateSettings);

module.exports = router;
