import api from './client';
import i18n from '../i18n/config';

/**
 * Get language parameter for API calls
 */
const getApiLanguage = () => {
    try {
        if (!i18n || !i18n.language) {
            return 'en';
        }
        const currentLang = i18n.language;
        return (currentLang === 'malay') ? 'malay' : 'en';
    } catch (error) {
        return 'en';
    }
};

export const restaurantsAPI = {
    // Get restaurants by category
    getRestaurantsByCategory: async (categoryId, params = {}) => {
        const query = new URLSearchParams();
        query.append('category_id', categoryId);

        if (params.page) query.append('page', String(params.page));
        if (params.limit) query.append('limit', String(params.limit));
        if (params.user_lat) query.append('user_lat', String(params.user_lat));
        if (params.user_lng) query.append('user_lng', String(params.user_lng));
        if (params.sort_by) query.append('sort_by', params.sort_by);

        const lang = getApiLanguage();
        query.append('lang', lang);

        const res = await api.get(`/jomfood-settings/businesses?${query.toString()}`);
        return res?.data || res;
    },

    // Get all restaurants
    getRestaurants: async (params = {}) => {
        const query = new URLSearchParams();

        if (params.page) query.append('page', String(params.page));
        if (params.limit) query.append('limit', String(params.limit));
        if (params.user_lat) query.append('user_lat', String(params.user_lat));
        if (params.user_lng) query.append('user_lng', String(params.user_lng));
        if (params.sort_by) query.append('sort_by', params.sort_by);

        const lang = getApiLanguage();
        query.append('lang', lang);

        const res = await api.get(`/jomfood-settings/businesses?${query.toString()}`);
        return res?.data || res;
    },

    // Get single restaurant
    getRestaurant: async (id) => {
        const lang = getApiLanguage();
        const res = await api.get(`/business/${id}?lang=${lang}`);
        return res?.data || res;
    },
};

export default restaurantsAPI;
