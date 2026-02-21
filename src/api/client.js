/**
 * API Client - Base HTTP Client
 * 
 * CONCEPTS EXPLAINED:
 * 1. Fetch API: React Native's built-in HTTP client (like axios)
 * 2. Interceptors: Automatically add auth tokens to requests
 * 3. Error Handling: Centralized error processing
 * 
 * React Native uses 'fetch' which is built-in (no need to install axios)
 * 
 * Usage:
 * import api from '../api/client';
 * const response = await api.post('/auth/login', { email, password });
 */

import API_CONFIG from '../config/api';
import { authStorage } from '../utils/authStorage';
import i18n from '../i18n/config';

// ===== Refresh Token State =====
let isRefreshing = false;
let refreshWaitQueue = [];

const enqueueRefreshWaiter = () => new Promise((resolve, reject) => {
  refreshWaitQueue.push({ resolve, reject });
});

const drainRefreshQueue = (error, newToken) => {
  refreshWaitQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  refreshWaitQueue = [];
};

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return enqueueRefreshWaiter();
  }

  isRefreshing = true;
  try {
    const refreshToken = await authStorage.getRefreshToken();
    if (!refreshToken) {
      throw { message: 'Missing refresh token', error: 'NO_REFRESH_TOKEN' };
    }

    const url = `${API_CONFIG.BASE_URL}/auth/customer/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : { _text: await response.text() };

    if (!response.ok) {
      const error = createErrorFromResponse(data, response.status, response.statusText);
      throw error;
    }

    const newToken = data?.token || data?.data?.token;
    if (!newToken) {
      throw { message: 'Refresh token response missing token', error: 'INVALID_REFRESH_RESPONSE' };
    }

    await authStorage.setAccessToken(newToken);
    drainRefreshQueue(null, newToken);
    return newToken;
  } catch (err) {
    drainRefreshQueue(err, null);
    // On failure, clear tokens
    await authStorage.clearAll();
    throw err;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Get current language for API calls
 * Returns 'malay' for Malay, 'en' for English
 */
const getApiLanguage = () => {
  try {
    if (!i18n || !i18n.language) {
      return 'en'; // Default to English if i18n not initialized
    }
    const currentLang = i18n.language;
    // Return 'malay' or 'en'
    return (typeof currentLang === 'string' && currentLang === 'malay') ? 'malay' : 'en';
  } catch (error) {
    // console.warn('⚠️ [API] Error getting language, defaulting to en:', error);
    return 'en';
  }
};

/**
 * Add language parameter to URL if needed
 */
const addLanguageParam = (url) => {
  const lang = getApiLanguage();
  if (!lang || typeof lang !== 'string') return url; // English or invalid - no lang param needed
  
  // Check if URL already has query parameters
  const hasQuery = url.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${url}${separator}lang=${lang}`;
};

/**
 * Create full URL from endpoint
 * Note: Language parameter should be added manually in API files when building query strings
 * to avoid duplication and ensure proper handling
 */
const getFullUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

/**
 * Determine if we should skip refresh logic for a given endpoint
 * We never refresh on auth endpoints (login/register/google/refresh) to avoid
 * recursive refresh attempts before any tokens exist.
 */
const shouldSkipRefresh = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return (
    path.includes('/auth/customer/login') ||
    path.includes('/auth/customer/register') ||
    path.includes('/auth/customer/google') ||
    path.includes('/auth/customer/apple') ||
    path.includes('/auth/customer/refresh')
  );
};

/**
 * Get headers with auth token if available
 */
const getHeaders = async (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Add auth token if available
  const token = await authStorage.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Safely parse response as JSON or text
 */
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      return await response.json();
    } catch (parseError) {
      // If JSON parse fails, try to get text
      const text = await response.text();
      if (__DEV__) {
        // console.error('⚠️ JSON Parse Failed. Response text:', text.substring(0, 200));
      }
      throw {
        message: 'Invalid JSON response from server',
        error: 'JSON_PARSE_ERROR',
        responseText: text.substring(0, 500), // First 500 chars for debugging
        status: response.status,
      };
    }
  }

  // Not JSON, return as text
  const text = await response.text();
  return { _text: text }; // Return as object with text property
};

/**
 * Handle API errors
 * 
 * IMPORTANT: Response body can only be read ONCE!
 * This function expects already-parsed data, not the response object
 */
const createErrorFromResponse = (responseData, status, statusText) => {
  // If it's already an error object from parseResponse
  if (responseData.error) {
    return responseData;
  }

  // If it's JSON error response with message
  if (responseData.message || responseData.error) {
    return {
      message: responseData.message || 'An error occurred',
      error: responseData.error || 'UNKNOWN_ERROR',
      data: responseData,
      status: status,
    };
  }

  // If it's HTML or text response
  if (responseData._text) {
    return {
      message: `Server returned HTML/text instead of JSON. Status: ${status}`,
      error: 'INVALID_RESPONSE',
      status: status,
      hint: 'Check if API endpoint is correct. Server might be returning a 404 page.',
      responsePreview: responseData._text.substring(0, 200),
    };
  }

  // Fallback
  return {
    message: `Error ${status}: ${statusText}`,
    error: 'HTTP_ERROR',
    status: status,
  };
};

/**
 * Log network request (for debugging)
 * Set __DEV__ to false in production to disable logs
 */
const logRequest = (method, url, data, headers) => {
  if (__DEV__) {
    // console.log(`\n🌐 [API ${method}] ${url}`);
    // if (data) {
    //   console.log('📤 Request Body:', JSON.stringify(data, null, 2));
    // }
    // if (headers.Authorization) {
    //   console.log('🔑 Auth Token: Present (hidden for security)');
    // }
  }
};

/**
 * Log network response (for debugging)
 */
const logResponse = (method, url, response, responseData) => {
  if (__DEV__) {
    // const status = response?.status || 'N/A';
    // const statusColor = status >= 200 && status < 300 ? '✅' : '❌';
    // console.log(`${statusColor} [API ${method}] ${url} - Status: ${status}`);
    // if (responseData) {
    //   console.log('📥 Response:', JSON.stringify(responseData, null, 2));
    // }
  }
};

/**
 * Main API client
 */
const api = {
  /**
   * GET request
   */
  get: async (endpoint, options = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const headers = await getHeaders(options.headers);
      // console.log('🌐 [API GET] URL:', url);

      // Log request
      logRequest('GET', url, null, headers);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        ...options,
      });

      // Parse response (handles JSON and non-JSON)
      // IMPORTANT: Read response body only ONCE (can't read it again!)
      const responseData = await parseResponse(response);

      // Log response
      logResponse('GET', url, response, responseData);

      // Check if error status - use already-parsed data
      if (!response.ok) {
        // Handle 401 with refresh logic (once per request)
        if (response.status === 401 && !options._retry && !shouldSkipRefresh(endpoint)) {
          const hasRefresh = await authStorage.getRefreshToken();
          if (hasRefresh) {
            try {
              await refreshAccessToken();
              // Retry original request with _retry flag
              return await api.get(endpoint, { ...options, _retry: true });
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }
        const error = createErrorFromResponse(responseData, response.status, response.statusText);
        throw error;
      }

      // If response is text (not JSON), return it properly
      if (responseData._text) {
        return { data: responseData._text };
      }

      return responseData;
    } catch (error) {
      // Log error
      if (__DEV__) {
        // console.error('❌ [API GET Error]', error);
      }
      // If error was already processed, rethrow it
      if (error.message && error.error) {
        throw error;
      }
      // Network error (no response available)
      throw {
        message: error.message || 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * POST request
   */
  post: async (endpoint, data, options = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const headers = await getHeaders(options.headers);

      // console.log('🌐 [API POST] URL:', url);
      // Log request
      logRequest('POST', url, data, headers);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options,
      });

      // Parse response (handles JSON and non-JSON)
      // IMPORTANT: Read response body only ONCE (can't read it again!)
      const responseData = await parseResponse(response);

      // Log response
      logResponse('POST', url, response, responseData);

      // Check if error status - use already-parsed data
      if (!response.ok) {
        if (response.status === 401 && !options._retry && !shouldSkipRefresh(endpoint)) {
          const hasRefresh = await authStorage.getRefreshToken();
          if (hasRefresh) {
            try {
              await refreshAccessToken();
              return await api.post(endpoint, data, { ...options, _retry: true });
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }
        const error = createErrorFromResponse(responseData, response.status, response.statusText);
        throw error;
      }

      // If response is text (not JSON), return it properly
      if (responseData._text) {
        return { data: responseData._text };
      }

      return responseData;
    } catch (error) {
      // Log detailed error
      if (__DEV__) {
        // console.error('❌ [API POST Error]', error);
        // if (error.hint) {
        //   console.error('💡 Hint:', error.hint);
        // }
        // if (error.responsePreview) {
        //   console.error('📄 Response Preview:', error.responsePreview);
        // }
      }
      
      // If error is already processed, rethrow it
      if (error.message && error.error) {
        throw error;
      }
      
      // Network error (no response available)
      throw {
        message: error.message || 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * PUT request
   */
  put: async (endpoint, data, options = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const headers = await getHeaders(options.headers);

      // Log request
      logRequest('PUT', url, data, headers);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options,
      });

      // Parse response (handles JSON and non-JSON)
      // IMPORTANT: Read response body only ONCE (can't read it again!)
      const responseData = await parseResponse(response);

      // Log response
      logResponse('PUT', url, response, responseData);

      // Check if error status - use already-parsed data
      if (!response.ok) {
        if (response.status === 401 && !options._retry && !shouldSkipRefresh(endpoint)) {
          const hasRefresh = await authStorage.getRefreshToken();
          if (hasRefresh) {
            try {
              await refreshAccessToken();
              return await api.put(endpoint, data, { ...options, _retry: true });
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }
        const error = createErrorFromResponse(responseData, response.status, response.statusText);
        throw error;
      }

      // If response is text (not JSON), return it properly
      if (responseData._text) {
        return { data: responseData._text };
      }

      return responseData;
    } catch (error) {
      // Log error
      if (__DEV__) {
        // console.error('❌ [API PUT Error]', error);
      }
      if (error.message && error.error) {
        throw error;
      }
      // Network error (no response available)
      throw {
        message: error.message || 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data, options = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const headers = await getHeaders(options.headers);

      // console.log('🌐 [API PATCH] URL:', url);
      // Log request
      logRequest('PATCH', url, data, headers);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      // Parse response (handles JSON and non-JSON)
      // IMPORTANT: Read response body only ONCE (can't read it again!)
      const responseData = await parseResponse(response);

      // Log response
      logResponse('PATCH', url, response, responseData);

      // Check if error status - use already-parsed data
      if (!response.ok) {
        if (response.status === 401 && !options._retry && !shouldSkipRefresh(endpoint)) {
          const hasRefresh = await authStorage.getRefreshToken();
          if (hasRefresh) {
            try {
              await refreshAccessToken();
              return await api.patch(endpoint, data, { ...options, _retry: true });
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }
        const error = createErrorFromResponse(responseData, response.status, response.statusText);
        throw error;
      }

      // If response is text (not JSON), return it properly
      if (responseData._text) {
        return { data: responseData._text };
      }

      return responseData;
    } catch (error) {
      // Log detailed error
      if (__DEV__) {
        // console.error('❌ [API PATCH Error]', error);
        // if (error.hint) {
        //   console.error('💡 Hint:', error.hint);
        // }
        // if (error.responsePreview) {
        //   console.error('📄 Response Preview:', error.responsePreview);
        // }
      }
      
      // If error is already processed, rethrow it
      if (error.message && error.error) {
        throw error;
      }
      
      // Network error (no response available)
      throw {
        message: error.message || 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      };
    }
  },

  /**
   * DELETE request
   */
  delete: async (endpoint, options = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const headers = await getHeaders(options.headers);

      // Log request
      logRequest('DELETE', url, null, headers);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        ...options,
      });

      // Parse response (handles JSON and non-JSON)
      // IMPORTANT: Read response body only ONCE (can't read it again!)
      const responseData = await parseResponse(response);

      // Log response
      logResponse('DELETE', url, response, responseData);

      // Check if error status - use already-parsed data
      if (!response.ok) {
        if (response.status === 401 && !options._retry && !shouldSkipRefresh(endpoint)) {
          const hasRefresh = await authStorage.getRefreshToken();
          if (hasRefresh) {
            try {
              await refreshAccessToken();
              return await api.delete(endpoint, { ...options, _retry: true });
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }
        const error = createErrorFromResponse(responseData, response.status, response.statusText);
        throw error;
      }

      // If response is text (not JSON), return it properly
      if (responseData._text) {
        return { data: responseData._text };
      }

      return responseData;
    } catch (error) {
      // Log error
      if (__DEV__) {
        // console.error('❌ [API DELETE Error]', error);
      }
      if (error.message && error.error) {
        throw error;
      }
      // Network error (no response available)
      throw {
        message: error.message || 'Network error. Please check your internet connection.',
        error: 'NETWORK_ERROR',
      };
    }
  },
};

export default api;

