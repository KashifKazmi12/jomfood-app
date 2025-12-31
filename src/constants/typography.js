/**
 * JomFood - Global Typography Theme
 * 
 * Centralized typography system for consistent fonts throughout the app.
 * 
 * Usage:
 * import typography from '../constants/typography';
 * fontFamily: typography.fontFamily.regular
 */

const typography = {
  // Font Family
  fontFamily: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    // Default to regular if no weight specified
    default: 'Poppins-Regular',
  },

  // Font Sizes
  fontSize: {
    xxs: 9,
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '6xl': 42,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // Gradients and decoration tokens (non-text visual tokens colocated for convenience)
  gradients: {
    appBackground: {
      colors: ['rgba(255,255,255,0)', 'rgba(254,129,0,0.2)'],
      // colors: ['rgba(255,255,255,0)', 'rgba(63, 175, 84, 0.2)'],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
};

export default typography;

