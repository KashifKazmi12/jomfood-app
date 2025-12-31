import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for language management
 * Provides language switching functionality with persistence
 * 
 * NOTE: This hook requires QueryClientProvider to be in the component tree.
 * Make sure AppProviders wraps components using this hook.
 */
export default function useLanguage() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Sync with i18n language changes
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  /**
   * Change the app language
   * @param {string} languageCode - Language code ('en' or 'malay')
   */
  const changeLanguage = async (languageCode) => {
    if (languageCode !== 'en' && languageCode !== 'malay') {
      // console.error(`Invalid language code: ${languageCode}`);
      return;
    }

    if (i18n.language === languageCode) {
      return; // Already set
    }

    setIsChanging(true);
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('userLanguage', languageCode);
      setCurrentLanguage(languageCode);
      
      // No need to invalidate queries - APIs don't use language params
      // Static text changes are handled by i18n JSON files
    } catch (error) {
      // console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  /**
   * Get available languages
   */
  const getLanguages = () => [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'malay', name: 'Bahasa Melayu', flag: '🇲🇾' },
  ];

  return {
    currentLanguage,
    changeLanguage,
    getLanguages,
    isChanging,
  };
}

