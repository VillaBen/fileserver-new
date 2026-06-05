/**
 * 统一JSON响应工具
 * 所有API都使用这个格式返回数据
 */

class ApiResponse {
  static success(data = null, message = '操作成功') {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = '操作失败', code = 'ERROR') {
    return {
      success: false,
      error: {
        code,
        message
      },
      timestamp: new Date().toISOString()
    };
  }

  static paginated(data, pagination) {
    return {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.pageSize)
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;
