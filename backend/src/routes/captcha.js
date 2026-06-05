/**
 * 验证码路由
 */

const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// 生成验证码
router.get('/generate', async (req, res) => {
  try {
    // 生成随机验证码
    const captchaId = crypto.randomBytes(16).toString('hex');
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 创建SVG验证码图片（简化版本）
    // 实际应使用canvas或svg-captcha库
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="56">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="32" 
              fill="#333" text-anchor="middle" dy=".3em">${code}</text>
        <line x1="0" y1="0" x2="180" y2="56" stroke="#ccc" stroke-width="1"/>
        <line x1="180" y1="0" x2="0" y2="56" stroke="#ccc" stroke-width="1"/>
      </svg>
    `;

    const base64 = Buffer.from(svg).toString('base64');
    const image = `data:image/svg+xml;base64,${base64}`;

    // 在实际应用中，这里应该将captchaId和code存储到会话或缓存中
    // 为了简化，暂时存储在内存中（生产环境应使用Redis等）
    if (!global.captchaStore) {
      global.captchaStore = new Map();
    }
    global.captchaStore.set(captchaId, code);

    // 设置过期时间（5分钟）
    setTimeout(() => {
      global.captchaStore.delete(captchaId);
    }, 5 * 60 * 1000);

    res.apiSuccess({
      captchaId,
      image
    });
  } catch (error) {
    console.error('生成验证码错误:', error);
    res.apiError('生成验证码失败', 'CAPTCHA_ERROR');
  }
});

// 验证验证码
router.post('/verify', async (req, res) => {
  try {
    const { captchaId, captchaCode } = req.body;

    if (!captchaId || !captchaCode) {
      return res.apiError('验证码ID和验证码不能为空', 'VALIDATION_ERROR');
    }

    // 从存储中获取验证码
    const storedCode = global.captchaStore?.get(captchaId);

    if (!storedCode) {
      return res.apiError('验证码已过期', 'CAPTCHA_EXPIRED');
    }

    // 验证（不区分大小写）
    if (storedCode.toUpperCase() !== captchaCode.toUpperCase()) {
      return res.apiError('验证码错误', 'CAPTCHA_INVALID');
    }

    // 删除已使用的验证码
    global.captchaStore.delete(captchaId);

    res.apiSuccess(null, '验证成功');
  } catch (error) {
    console.error('验证验证码错误:', error);
    res.apiError('验证失败', 'VERIFY_ERROR');
  }
});

module.exports = router;
