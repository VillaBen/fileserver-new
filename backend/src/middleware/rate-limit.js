/**
 * 简易内存版 Rate Limiter
 */

function createRateLimit({ windowMs = 15 * 60 * 1000, max = 100, keyGenerator } = {}) {
  const store = new Map();

  const defaultKeyGenerator = (req) => req.ip;
  const genKey = keyGenerator || defaultKeyGenerator;

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = genKey(req);

    let record = store.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    record.count += 1;
    store.set(key, record);

    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: '请求过于频繁，请稍后再试'
        }
      });
    }

    next();
  };
}

const authRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
const strictAuthRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

module.exports = {
  createRateLimit,
  authRateLimit,
  strictAuthRateLimit
};
