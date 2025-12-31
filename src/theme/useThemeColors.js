import { useColorScheme } from 'react-native';
import baseColors, { darkColors } from '../constants/colors';

export default function useThemeColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  // return isDark ? darkColors : baseColors;
  return baseColors;
}