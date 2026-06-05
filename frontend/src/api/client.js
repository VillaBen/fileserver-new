import axios from 'axios';
import router from '../router';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Q3: Handle 401 and other errors
apiClient.interceptors.response.use(
  (response) => {
    // Handle blob responses specially
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response.data;
  },
  (error) => {
    let errorResult = {
      success: false,
      error: 'Request failed',
      code: 'UNKNOWN_ERROR',
    };

    if (error.response) {
      const { data, status } = error.response;

      // Q3: Handle 401 Unauthorized - redirect to login
      if (status === 401) {
        // Clear user data
        localStorage.removeItem('filecloud_user');
        localStorage.removeItem('csrfToken');
        
        // Redirect to login page
        router.push('/login');
        
        errorResult = {
          success: false,
          error: 'Session expired, please login again',
          code: 'UNAUTHORIZED',
        };
        return Promise.reject(errorResult);
      }

      // Handle 403 Forbidden
      if (status === 403) {
        errorResult = {
          success: false,
          error: 'Access denied',
          code: 'FORBIDDEN',
        };
        return Promise.reject(errorResult);
      }

      // Handle 404 Not Found
      if (status === 404) {
        errorResult = {
          success: false,
          error: 'Resource not found',
          code: 'NOT_FOUND',
        };
        return Promise.reject(errorResult);
      }

      // Handle 500 Server Error
      if (status >= 500) {
        errorResult = {
          success: false,
          error: 'Server error, please try again later',
          code: 'SERVER_ERROR',
        };
        return Promise.reject(errorResult);
      }

      if (error.config?.responseType === 'blob') {
        errorResult = {
          success: false,
          error: 'Download failed',
          code: 'DOWNLOAD_ERROR',
        };
      } else if (data) {
        errorResult = data;
      } else {
        errorResult.error = `Server error (${status})`;
        errorResult.code = `HTTP_${status}`;
      }
    } else if (error.request) {
      errorResult.error = 'Network error, please check your connection';
      errorResult.code = 'NETWORK_ERROR';
    } else {
      errorResult.error = error.message;
    }

    return Promise.reject(errorResult);
  }
);

export default apiClient;
