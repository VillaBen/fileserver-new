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
    return res.status(400).json(ApiResponse.error(message, code));
  };

  res.apiPaginated = function(data, pagination) {
    return res.json(ApiResponse.paginated(data, pagination));
  };

  next();
}

module.exports = apiResponseHandler;
