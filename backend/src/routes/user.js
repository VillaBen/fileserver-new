// src/routes/user.js
const express = require('express');
const multer = require('multer');
const userController = require('../controllers/UserController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer();

router.post('/check-username', requireAuth, userController.checkUsername);
router.post('/check-email', requireAuth, userController.checkEmail);
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.get('/storage', requireAuth, userController.getStorageInfo);
router.post('/security-question', requireAuth, userController.setSecurityQuestion);
router.post('/verify-security-question', requireAuth, userController.verifySecurityQuestion);
router.post('/avatar', requireAuth, upload.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', requireAuth, userController.deleteAvatar);
router.get('/avatar/:filename', userController.getAvatarFile);

module.exports = router;
