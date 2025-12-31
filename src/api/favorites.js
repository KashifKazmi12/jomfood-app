import api from './client';
import i18n from '../i18n/config';

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
    // console.warn('⚠️ [favoritesAPI] Error getting language, defaulting to en:', error);
    return 'en';
  }
};

export const favoritesAPI = {
  /**
   * Toggle favorite status for a deal
   * POST /api/jomfood-deals/favorites/:deal_id/toggle
   */
  toggleFavorite: async (dealId) => {
    // Validate dealId is a valid MongoDB ObjectId (24 hex characters)
    if (!dealId || typeof dealId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(dealId)) {
      throw { 
        message: 'Invalid deal ID format', 
        error: 'INVALID_DEAL_ID',
        dealId 
      };
    }
    // Add language parameter
    const lang = getApiLanguage();
    const langParam = (lang && typeof lang === 'string') ? `?lang=${lang}` : '';
    const response = await api.post(`/jomfood-deals/favorites/${dealId}/toggle${langParam}`);
    // API client returns the parsed JSON directly
    // Response structure: { success: true, data: { is_favorite: true, message: "..." } }
    // console.log('🔄 [favoritesAPI.toggleFavorite] Full response:', response);
    return response;
  },

  /**
   * Get all favorite deals for the authenticated customer
   * GET /api/jomfood-deals/favorites
   */
  getFavoriteDeals: async (params = {}) => {
    const query = new URLSearchParams();
    
    // Add language parameter
    const lang = getApiLanguage();
    if (lang && typeof lang === 'string') {
      query.append('lang', lang);
    }
    
    // Add other params
    query.append('page', String(params.page ?? 1));
    query.append('limit', String(params.limit ?? 12));
    query.append('sort_by', params.sort_by ?? 'favorited_newest');
    if (params.deal_type) query.append('deal_type', params.deal_type);
    if (params.min_price) query.append('min_price', String(params.min_price));
    if (params.max_price) query.append('max_price', String(params.max_price));
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.company_name) query.append('company_name', params.company_name);
    if (params.business_id) query.append('business_id', params.business_id);
    if (params.group_id) query.append('group_id', params.group_id);

    const response = await api.get(`/jomfood-deals/favorites?${query.toString()}`);
    // console.log('🔍 [favoritesAPI.getFavoriteDeals] Full response:', response);
    
    // API client returns the parsed JSON directly
    // Response structure: { success: true, data: { deals: [...], pagination: {...} } }
    // So response is the full object, and response.data is the inner data object
    const data = response?.data || {};
    // console.log('🔍 [favoritesAPI.getFavoriteDeals] Extracted data:', data);
    // console.log('🔍 [favoritesAPI.getFavoriteDeals] Deals:', data.deals, 'Type:', Array.isArray(data.deals));
    // console.log('🔍 [favoritesAPI.getFavoriteDeals] Pagination:', data.pagination);
    
    return {
      deals: Array.isArray(data.deals) ? data.deals : [],
      pagination: data.pagination || null,
    };
  },

  /**
   * Check if a deal is favorited by the authenticated customer
   * GET /api/jomfood-deals/favorites/:deal_id/status
   */
  checkFavoriteStatus: async (dealId) => {
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
    const response = await api.get(`/jomfood-deals/favorites/${dealId}/status${langParam}`);
    // API client returns the parsed JSON directly
    // Response structure: { success: true, data: { is_favorite: true, favorited_at: "..." } }
    // So response is the full object, and response.data is the inner data object
    const result = response?.data || { is_favorite: false, favorited_at: null };
    // console.log('🔍 [favoritesAPI.checkFavoriteStatus] Response:', response);
    // console.log('🔍 [favoritesAPI.checkFavoriteStatus] Extracted data:', result);
    // console.log('🔍 [favoritesAPI.checkFavoriteStatus] is_favorite:', result.is_favorite, typeof result.is_favorite);
    return result;
  },
};

export default favoritesAPI;

