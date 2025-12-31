import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RangeSlider({ 
  min = 0, 
  max = 100, 
  minValue, 
  maxValue, 
  onMinChange, 
  onMaxChange,
  label = '',
  step = 1,
  formatValue = null,
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const [trackLayout, setTrackLayout] = useState({ x: 0, width: SCREEN_WIDTH - 88 });
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const activeThumbRef = useRef(null); // Use ref instead of state for immediate access

  const formatDisplayValue = (value) => {
    if (formatValue) {
      return formatValue(value);
    }
    // Default: assume price format (RM)
    if (max <= 500) {
      return `RM ${value}`;
    }
    // Discount format (%)
    return `${value}%`;
  };

  const getValueFromX = (x) => {
    const relativeX = Math.max(0, Math.min(x - trackLayout.x, trackLayout.width));
    const value = ((relativeX / trackLayout.width) * (max - min) + min);
    return Math.round(value / step) * step;
  };

  const updateTrackLayout = () => {
    if (containerRef.current && trackRef.current) {
      containerRef.current.measure((cx, cy, cw, ch, cpx, cpy) => {
        trackRef.current.measure((fx, fy, fw, fh, fpx, fpy) => {
          const padding = 10;
          setTrackLayout({ 
            x: fpx + padding, 
            width: fw - (padding * 2) 
          });
        });
      });
    }
  };

  const minPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      activeThumbRef.current = 'min';
      updateTrackLayout();
      // Update immediately on grant
      const newValue = getValueFromX(evt.nativeEvent.pageX);
      const clampedValue = Math.max(min, Math.min(maxValue - step, newValue));
      onMinChange(clampedValue);
    },
    onPanResponderMove: (evt) => {
      if (activeThumbRef.current === 'min') {
        const newValue = getValueFromX(evt.nativeEvent.pageX);
        const clampedValue = Math.max(min, Math.min(maxValue - step, newValue));
        onMinChange(clampedValue);
      }
    },
    onPanResponderRelease: () => {
      activeThumbRef.current = null;
    },
    onPanResponderTerminate: () => {
      activeThumbRef.current = null;
    },
  }), [min, max, maxValue, step, trackLayout, onMinChange]);

  const maxPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      activeThumbRef.current = 'max';
      updateTrackLayout();
      // Update immediately on grant
      const newValue = getValueFromX(evt.nativeEvent.pageX);
      const clampedValue = Math.max(minValue + step, Math.min(max, newValue));
      onMaxChange(clampedValue);
    },
    onPanResponderMove: (evt) => {
      if (activeThumbRef.current === 'max') {
        const newValue = getValueFromX(evt.nativeEvent.pageX);
        const clampedValue = Math.max(minValue + step, Math.min(max, newValue));
        onMaxChange(clampedValue);
      }
    },
    onPanResponderRelease: () => {
      activeThumbRef.current = null;
    },
    onPanResponderTerminate: () => {
      activeThumbRef.current = null;
    },
  }), [min, max, minValue, step, trackLayout, onMaxChange]);

  const minPosition = trackLayout.width > 0 ? ((minValue - min) / (max - min)) * trackLayout.width : 0;
  const maxPosition = trackLayout.width > 0 ? ((maxValue - min) / (max - min)) * trackLayout.width : trackLayout.width;

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.labelRow}>
        <View style={styles.valuesRow}>
          <Text style={styles.valueText}>{formatDisplayValue(minValue)}</Text>
          <Text style={styles.valueText}>{formatDisplayValue(maxValue)}</Text>
        </View>
      </View>
      <View 
        ref={containerRef}
        style={styles.sliderContainer}
        onLayout={() => {
          // Small delay to ensure layout is complete
          setTimeout(() => {
            updateTrackLayout();
          }, 0);
        }}
      >
        <View 
          ref={trackRef}
          style={styles.track}
        >
          <View style={[styles.activeTrack, { left: minPosition, width: maxPosition - minPosition }]} />
        </View>
        <View 
          style={[styles.thumb, { left: minPosition }]} 
          {...minPanResponder.panHandlers}
        />
        <View 
          style={[styles.thumb, { left: maxPosition }]} 
          {...maxPanResponder.panHandlers}
        />
      </View>
    </View>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    marginVertical: 0,
    paddingHorizontal: 0,
  },
  labelRow: {
    marginBottom: 8,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  valueText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  sliderContainer: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 10,
  },
  track: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    position: 'relative',
  },
  activeTrack: {
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 10, // Center thumb on track: container (44px) / 2 - thumb (24px) / 2 = 22 - 12 = 10px
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
