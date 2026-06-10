/**
 * 统一响应中间件
 * 确保所有API返回格式一致
 */

const ApiResponse = require('../utils/response');

function apiResponseHandler(req, res, next) {
  // 扩展 res 对象，添加便捷方法
  res.apiSuccess = function(data = null, message = '操作成功') {
    return res.json(ApiResponse.success(data, message));
  };

  res.apiError = function(message = '操作失败', code = 'ERROR') {
    // 根据错误码返回对应的 HTTP 状态码
    let statusCode = 400;
    switch (code) {
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
        statusCode = 401;
        break;
      case 'FORBIDDEN':
        statusCode = 403;
        break;
      case 'FILE_NOT_FOUND':
      case 'NOT_FOUND':
        statusCode = 404;
        break;
      case 'CONFLICT':
        statusCode = 409;
        break;
      case 'TOO_LARGE':
        statusCode = 413;
        break;
      case 'UNSUPPORTED_FORMAT':
        statusCode = 415;
        break;
      case 'INTERNAL_ERROR':
        statusCode = 500;
        break;
    }
    return res.status(statusCode).json(ApiResponse.error(message, code));
  };

  res.apiPaginated = function(data, pagination) {
    return res.json(ApiResponse.paginated(data, pagination));
  };

  next();
}

module.exports = apiResponseHandler;
