import { APP_WEB_BASE_URL } from './api';

/**
 * Public JomFood web base URL for invite links (?ref=CODE).
 * Same origin as deal/share links (`APP_WEB_BASE_URL` from `.env` via `react-native-dotenv`).
 */
export const JOMFOOD_WEB_SIGNUP_BASE = APP_WEB_BASE_URL;

export function buildSignupInviteUrl(referralCode) {
  const base = String(JOMFOOD_WEB_SIGNUP_BASE || '').replace(/\/$/, '');
  const code = String(referralCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!base || !code) return '';
  return `${base}/signup?ref=${encodeURIComponent(code)}`;
}
