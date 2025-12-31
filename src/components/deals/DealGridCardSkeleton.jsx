import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import useThemeColors from '../../theme/useThemeColors';
import useThemeTypography from '../../theme/useThemeTypography';

export default function DealGridCardSkeleton() {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  return (
    <View style={styles.card}>
      {/* Top Section: Text Information Skeleton */}
      <View style={styles.topSection}>
        {/* Title skeleton */}
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.titleSkeleton}
          shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
        />
        
        {/* Description skeleton - 2 lines */}
        <View style={styles.descContainer}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.descLine1}
            shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.descLine2}
            shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
          />
        </View>
        
        {/* Pricing skeleton */}
        <View style={styles.pricingRow}>
          <View style={styles.pricingContainer}>
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.priceSkeleton}
              shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              style={styles.originalPriceSkeleton}
              shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
            />
          </View>
        </View>
      </View>

      {/* Bottom Section: Image Skeleton */}
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.imageContainer}
        shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
      />

      {/* Add Button Skeleton */}
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.addBtn}
        shimmerColors={['#E5E5E5', '#F0F0F0', '#E5E5E5']}
      />
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 220,
  },
  topSection: {
    flex: 1,
    paddingBottom: 8,
  },
  titleSkeleton: {
    height: 20,
    width: '80%',
    marginBottom: 8,
    borderRadius: 4,
  },
  descContainer: {
    marginBottom: 12,
    gap: 6,
  },
  descLine1: {
    height: 14,
    width: '100%',
    borderRadius: 4,
  },
  descLine2: {
    height: 14,
    width: '75%',
    borderRadius: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceSkeleton: {
    height: 24,
    width: 60,
    borderRadius: 4,
  },
  originalPriceSkeleton: {
    height: 16,
    width: 50,
    borderRadius: 4,
  },
  imageContainer: {
    height: 120,
    borderRadius: 12,
    marginTop: 8,
  },
  addBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});

