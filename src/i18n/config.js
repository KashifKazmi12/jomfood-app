import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enTranslations from './locales/en.json';
import malayTranslations from './locales/malay.json';

// Language detection using AsyncStorage
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Add a small delay to ensure AsyncStorage is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to Malay (malay) as per your requirement
        callback('malay');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      // Default to Malay if there's any error
      callback('malay');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('userLanguage', language);
    } catch (error) {
      console.error('Error saving language:', error);
      // Don't crash if saving fails
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: enTranslations,
      },
      malay: {
        translation: malayTranslations,
      },
    },
    fallbackLng: 'malay', // Default to Malay
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;

