/**
 * GradientBackground - Reusable gradient background wrapper
 * 
 * Provides consistent gradient background across all screens
 * Matches the app's design system gradient
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import useThemeTypography from '../theme/useThemeTypography';
import useThemeColors from '../theme/useThemeColors';

export default function GradientBackground({ children, style }) {
  const typography = useThemeTypography();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Background overlay gradient: transparent to primaryLight tint */}
      <LinearGradient
        colors={typography.gradients.appBackground.colors}
        locations={typography.gradients.appBackground.locations}
        start={typography.gradients.appBackground.start}
        end={typography.gradients.appBackground.end}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
});

