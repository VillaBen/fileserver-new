/**
 * 错误处理中间件
 */

function errorHandler(err, req, res, next) {
  console.error('❌ API错误:', err);

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;
  const message = isProd ? '服务器内部错误' : (err.message || '服务器内部错误');

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: message
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
