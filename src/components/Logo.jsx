import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';
import typography from '../constants/typography';

const source = require('../assets/images/jomfood.png');

/**
 * Logo Component
 *
 * Props:
 * - size: number | 'sm' | 'md' | 'lg' (default: 'md')
 * - showText: boolean (default: false) → renders brand text under logo
 * - text: string (default: 'JomFood')
 * - align: 'center' | 'left' (default: 'center')
 */
export default function Logo({ size = 'md', showText = false, height = 28, text = 'JomFood', align = 'center', style = {} }) {
  const resolvedSize = typeof size === 'number' ? size : size === 'lg' ? 120 : size === 'sm' ? 56 : 80;
  const resolvedHeight = typeof size === 'number' ? height : size === 'lg' ? 120 : size === 'sm' ? 56 : 80;

  return (
    <View style={[styles.container, align === 'left' && styles.left, style]}> 
      <Image
        source={source}
        style={[styles.image, { width: resolvedSize, height: resolvedHeight }]}
        
      />
      {showText ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    alignItems: 'flex-start',
  },
  text: {
    marginTop: 1,
    fontSize: 18,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
});


