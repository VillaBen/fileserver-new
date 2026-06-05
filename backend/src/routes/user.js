// src/routes/user.js
const express = require('express');
const multer = require('multer');
const userController = require('../controllers/UserController');

const router = express.Router();
const upload = multer();

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/storage', userController.getStorageInfo);
router.post('/security-question', userController.setSecurityQuestion);
router.post('/verify-security-question', userController.verifySecurityQuestion);
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', userController.deleteAvatar);
router.get('/avatar/:filename', userController.getAvatarFile);

module.exports = router;
