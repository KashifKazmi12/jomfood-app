/**
 * JomFood - Global Color Theme
 * 
 * CONCEPTS EXPLAINED:
 * 1. Centralized Colors: All colors in one place for easy maintenance
 * 2. Light/Dark Mode: Support for both themes
 * 3. Color Naming: Semantic names (primary, secondary) instead of hex codes
 * 
 * Usage:
 * import colors from '../constants/colors';
 * backgroundColor: colors.primary
 */

// TODO: Replace these with your actual color palette
const colors = {
  // Primary Brand Colors
  // primary: '#C40C0C',        // Main brand color (orange/red for food apps)
  // primaryLight: '#FE8100',   // Lighter shade
  // primaryLighter: '#FFEFEF', // Lighter shade
  // primaryDark: '#E55A2B',    // Darker shade

  // // Secondary Colors
  // secondary: '#4ECDC4',      // Secondary brand color
  // secondaryLight: '#7EDFD8',
  // secondaryDark: '#3AB8B1',

  // Primary Brand Colors
  primary: '#F73919',        // Main brand color (orange/red for food apps)
  primaryLight: '#3FAF54',   // Lighter shade
  primaryLighter: '#EDFAF0', // Lighter shade
  primaryDark: '#219F4D',    // Darker shade

  // Secondary Colors
  secondary: '#4ECDC4',      // Secondary brand color
  secondaryLight: '#7EDFD8',
  secondaryDark: '#3AB8B1',

  // Text Colors (adjusted to match new palette instead of pure black everywhere)
  text: '#172B1A',         // Deep green-tinted near-black (better harmony)
  textLight: '#FFFFFF',
  textMuted: '#4A5C4D',    // Muted green-gray (instead of harsh black)
  textDark: '#0F1A12',     // Darker green-black for strong contrast

  // Background Colors (remove beige/orange bias)
  background: '#FFFFFF',
  backgroundLight: '#F3F7F4', // faint green-tinted neutral
  backgroundDark: '#11261A',  // deep green-black for dark mode surfaces
  surface: '#FFFFFF',
  cardBackground: '#F5FAF7',  // replaces beige with soft green-neutral

  // Accent Colors (shifted away from orange-based tints)
  success: '#219F4D',       // already perfect
  error: '#D64545',         // red tuned slightly toward ember to match primary
  warning: '#E87F2A',       // ember-gold instead of orange
  info: '#2D8BC9',          // stays blue but slightly calmer

  // Border & Divider (cooler neutrals to match green palette)
  border: '#D6E2D9',         // soft green-gray
  divider: '#E3ECE5',        // lighter variant

  // Common Colors (unchanged; neutrals)
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  lightGray: '#E5E5E5',
  darkGray: '#333333',

  // // Text Colors
  // text: '#000000',           // Main text color
  // textLight: '#FFFFFF',       // Light text (for dark backgrounds)
  // textMuted: '#000000',      // Muted/secondary text
  // textDark: '#1A1A1A',       // Dark text

  // // Background Colors
  // background: '#FFFFFF',     // Main background
  // backgroundLight: '#F8F9FA', // Light gray background
  // backgroundDark: '#1A1A1A', // Dark background
  // surface: '#FFFFFF',        // Card/surface background
  // cardBackground: '#FFF8F3', // Card background (beige/off-white)

  // // Accent Colors
  // success: '#27AE60',        // Success/green
  // error: '#E74C3C',          // Error/red
  // warning: '#F39C12',        // Warning/orange
  // info: '#3498DB',           // Info/blue

  // // Border & Divider
  // border: '#E0E0E0',         // Border color
  // divider: '#F0F0F0',        // Divider line

  // // Common Colors
  // white: '#FFFFFF',
  // black: '#000000',
  // gray: '#808080',
  // lightGray: '#E5E5E5',
  // darkGray: '#333333',
};

// Dark mode colors (for future dark mode support)
const darkColors = {
  ...colors,
  text: '#FFFFFF',
  textLight: '#E0E0E0',
  textMuted: '#B0B0B0',
  textDark: '#FFFFFF',
  background: '#1A1A1A',
  backgroundLight: '#2C2C2C',
  backgroundDark: '#000000',
  surface: '#2C2C2C',
  border: '#404040',
  divider: '#333333',
};

export default colors;
export { darkColors };

