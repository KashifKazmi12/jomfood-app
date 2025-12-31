import api from './client';
import i18n from '../i18n/config';

// Normalize responses that can be either array or { deals, pagination }
const normalizeDealsResponse = (res) => {
  if (!res) return { deals: [], pagination: null };
  
  // Handle structure: { success: true, data: { deals: [...], pagination: {...} } }
  if (res.data && res.data.data && Array.isArray(res.data.data.deals)) {
    return { 
      deals: res.data.data.deals, 
      pagination: res.data.data.pagination || null 
    };
  }
  
  // Handle structure: { data: { deals: [...], pagination: {...} } }
  if (res.data && Array.isArray(res.data.deals)) {
    return { deals: res.data.deals, pagination: res.data.pagination || null };
  }
  
  // Handle structure: { data: [...] } (array directly)
  if (Array.isArray(res.data)) {
    return { deals: res.data, pagination: null };
  }
  
  // Some APIs might return array directly
  if (Array.isArray(res)) {
    return { deals: res, pagination: null };
  }
  
  return { deals: [], pagination: null };
};

/**
 * Get language parameter for API calls
 * Returns 'malay' for Malay, 'en' for English
 */
const getApiLanguage = () => {
  try {
    // Ensure i18n is initialized
    if (!i18n || !i18n.language) {
      return 'en'; // Default to English if i18n not ready
    }
    const currentLang = i18n.language;
    // Return 'malay' or 'en'
    return (typeof currentLang === 'string' && currentLang === 'malay') ? 'malay' : 'en';
  } catch (error) {
    // console.warn('⚠️ [dealsAPI] Error getting language, defaulting to en:', error);
    return 'en';
  }
};

export const dealsAPI = {
  listActive: async (params = {}) => {
    // console.log('🔍 [dealsAPI.listActive] Received params:', params);
    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    // Add required params
    query.append('sort_by', params.sort_by ?? 'newest');
    query.append('page', String(params.page ?? 1));
    query.append('limit', String(params.limit ?? 12));
    
    // Add optional params
    if (params.deal_type) query.append('deal_type', params.deal_type);
    if (params.min_price) query.append('min_price', String(params.min_price));
    if (params.max_price) query.append('max_price', String(params.max_price));
    if (params.min_discount) query.append('min_discount', String(params.min_discount));
    if (params.max_discount) query.append('max_discount', String(params.max_discount));
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.deal_category_id) query.append('deal_category_id', params.deal_category_id); // Keep for backward compatibility
    if (params.company_name) query.append('company_name', params.company_name);
    if (params.text_search) query.append('text_search', params.text_search);
    if (params.latitude) query.append('lat', String(params.latitude));
    if (params.longitude) query.append('lng', String(params.longitude));
    if (params.radius_km) query.append('radius_km', String(params.radius_km));
    if (params.is_hot_deal) query.append('is_hot_deal', 'true');
    
    // Handle tags array - join with comma
    if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
      query.append('tags', params.tags.join(','));
    }
    
    const queryString = query.toString();
    // console.log('🌐 [dealsAPI.listActive] Final query string:', queryString);
    const res = await api.get(`/jomfood-deals/active?${queryString}`);
    return normalizeDealsResponse(res);
  },

  detail: async (dealId) => {
    // Validate dealId is a valid MongoDB ObjectId (24 hex characters)
    if (!dealId || typeof dealId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(dealId)) {
      throw { 
        message: 'Invalid deal ID format', 
        error: 'INVALID_DEAL_ID',
        dealId 
      };
    }
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    const res = await api.get(`/jomfood-deals/detail/${dealId}${langParam}`);
    return res?.data || res;
  },

  claim: async ({ dealId, customerId }) => {
    // Validate IDs are valid MongoDB ObjectIds (24 hex characters)
    if (!dealId || typeof dealId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(dealId)) {
      throw { 
        message: 'Invalid deal ID format', 
        error: 'INVALID_DEAL_ID',
        dealId 
      };
    }
    if (!customerId || typeof customerId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(customerId)) {
      throw { 
        message: 'Invalid customer ID format', 
        error: 'INVALID_CUSTOMER_ID',
        customerId 
      };
    }
    // Add language parameter
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    const res = await api.post(`/jomfood-deals/${dealId}/claim${langParam}`, {
      customer_id: customerId,
    });
    return res?.data || res;
  },

  getClaimHistory: async (params = {}) => {
    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    // Add other params with validation
    if (params.customer_id) {
      // Validate customer_id is a valid MongoDB ObjectId
      if (typeof params.customer_id === 'string' && /^[0-9a-fA-F]{24}$/.test(params.customer_id)) {
        query.append('customer_id', params.customer_id);
      } else {
        throw { 
          message: 'Invalid customer ID format', 
          error: 'INVALID_CUSTOMER_ID',
          customer_id: params.customer_id 
        };
      }
    }
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    
    const queryString = query.toString();
    const res = await api.get(`/jomfood-deals/claims/history${queryString ? `?${queryString}` : ''}`);
    // Response structure: { success: true, data: { claims: [...], pagination: {...} } }
    if (res?.data?.claims && Array.isArray(res.data.claims)) {
      return {
        claims: res.data.claims,
        pagination: res.data.pagination || null,
      };
    }
    return { claims: [], pagination: null };
  },

  getDealOfTheDay: async () => {
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    const res = await api.get(`/jomfood-deals/deal-of-the-day${langParam}`);
    // Response structure: { success: true, data: { _id, deal_id, image, ... } }
    // Return null if no data or missing required fields
    if (res?.data && res.data.image && res.data.deal_id) {
      return res.data;
    }
    return null;
  },

  getAllTags: async () => {
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    const res = await api.get(`/jomfood-deals/tags${langParam}`);
    // Response structure: { success: true, data: [...], count: 5 }
    // API client returns the parsed JSON directly, so res = { success: true, data: [...], count: 2 }
    if (res?.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  // Get active deal categories
  getActiveDealCategories: async (params = {}) => {
    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    if (params.show_category !== undefined) {
      query.append('show_category', String(params.show_category));
    }
    const queryString = query.toString();
    const res = await api.get(`/jomfood-deal-categories/active${queryString ? `?${queryString}` : ''}`);
    // Response structure: { success: true, data: [...] }
    if (res?.data && Array.isArray(res.data)) {
      // Sort by sort_order if available
      return res.data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    return [];
  },
  getJomfoodCategories: async (params = {}) => {
    const query = new URLSearchParams();
    
    // Default params
    if (params.limit !== undefined) {
      query.append('limit', String(params.limit));
    } else {
      query.append('limit', '999999');
    }
    
    if (params.is_active !== undefined) {
      query.append('is_active', String(params.is_active));
    } else {
      query.append('is_active', 'true');
    }
    
    const queryString = query.toString();
    const res = await api.get(`/jomfood-categories?${queryString}`);
    // Response structure: { success: true, data: [...], pagination: {...} }
    console.log('📦 [getJomfoodCategories] Full response:', JSON.stringify(res, null, 2));
    // The API client returns the response directly, so res.data is the categories array
    if (res?.data && Array.isArray(res.data)) {
      console.log('📦 [getJomfoodCategories] Categories data:', JSON.stringify(res.data, null, 2));
      console.log('📦 [getJomfoodCategories] Number of categories:', res.data.length);
      return res.data;
    }
    console.log('📦 [getJomfoodCategories] No categories found. Res keys:', Object.keys(res || {}), 'res.data type:', typeof res?.data);
    return [];
  },

  // Get deals by category ID
  getDealsByCategory: async (dealCategoryId, params = {}) => {
    // console.log('🔍 [dealsAPI.getDealsByCategory] Category:', dealCategoryId, 'Params:', params);
    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    // Add category ID
    query.append('deal_category_id', dealCategoryId);
    
    // Add pagination
    query.append('limit', String(params.limit ?? 10));
    if (params.page) query.append('page', String(params.page));
    
    // Add optional filter params
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.deal_type) query.append('deal_type', params.deal_type);
    if (params.min_price) query.append('min_price', String(params.min_price));
    if (params.max_price) query.append('max_price', String(params.max_price));
    if (params.min_discount) query.append('min_discount', String(params.min_discount));
    if (params.max_discount) query.append('max_discount', String(params.max_discount));
    if (params.deal_category_id) query.append('deal_category_id', params.deal_category_id);
    if (params.text_search) query.append('text_search', params.text_search);
    if (params.latitude) query.append('lat', String(params.latitude));
    if (params.longitude) query.append('lng', String(params.longitude));
    if (params.radius_km) query.append('radius_km', String(params.radius_km));
    
    // Handle tags array
    if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
      query.append('tags', params.tags.join(','));
    }
    
    const queryString = query.toString();
    // console.log('🌐 [dealsAPI.getDealsByCategory] Final query:', queryString);
    const res = await api.get(`/jomfood-deals/active?${queryString}`);
    return normalizeDealsResponse(res);
  },
};

export default dealsAPI;


