/**
 * API Configuration
 *
 * Release / non-`__DEV__` builds read `API_BASE_URL` from `.env` at **bundle** time
 * (`react-native-dotenv`). If it is missing or blank, `PROD_API_FALLBACK` is used
 * so the app never calls `undefined` as a base URL.
 *
 * After changing `.env`, restart Metro with cache reset: `npx react-native start --reset-cache`
 *
 * `WEB_BASE_URL` (marketing / web app) is also read from `.env` via `@env`; see `APP_WEB_BASE_URL`.
 */

import { API_BASE_URL, WEB_BASE_URL } from '@env';

// Detect environment (__DEV__ is true in development mode)
const isDevelopment = __DEV__;

/** Used when `API_BASE_URL` from `.env` is missing or empty (e.g. misconfigured CI). */
const PROD_API_FALLBACK = 'https://jscapi.jomsmart.com/api';

/** Used when `WEB_BASE_URL` from `.env` is missing or empty in release builds. */
const PROD_WEB_FALLBACK = 'https://jomfood.my';

const DEV_BASE_URL = 'http://192.168.100.5:5055/api';

const releaseApiBase =
  typeof API_BASE_URL === 'string' && API_BASE_URL.trim().length > 0
    ? API_BASE_URL.trim()
    : PROD_API_FALLBACK;

const webFromEnv =
  typeof WEB_BASE_URL === 'string' && WEB_BASE_URL.trim().length > 0
    ? WEB_BASE_URL.trim().replace(/\/$/, '')
    : '';

/**
 * Public web origin for share links, deal deep links, referral signup URLs.
 * Release: `.env` `WEB_BASE_URL`, or `PROD_WEB_FALLBACK`.
 * Dev: `.env` if set, else local Vite default for web app development.
 */
export const APP_WEB_BASE_URL = isDevelopment
  ? webFromEnv || 'http://localhost:5173'
  : webFromEnv || PROD_WEB_FALLBACK;

const API_CONFIG = {
  DEV_BASE_URL,
  PROD_BASE_URL: releaseApiBase,
  BASE_URL: isDevelopment ? DEV_BASE_URL : releaseApiBase,
  TIMEOUT: 10000,
};

export default API_CONFIG;
