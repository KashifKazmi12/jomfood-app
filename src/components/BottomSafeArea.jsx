//bottom safe area spacing component
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomSafeArea() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.bottom }} />;
}