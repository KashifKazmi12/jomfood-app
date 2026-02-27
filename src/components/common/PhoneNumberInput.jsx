import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import useThemeColors from '../../theme/useThemeColors';
import useThemeTypography from '../../theme/useThemeTypography';

const COUNTRY_OPTIONS = [
  { code: 'MY', name: 'Malaysia', dialCode: '60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dialCode: '65', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', dialCode: '62', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', dialCode: '66', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dialCode: '63', flag: '🇵🇭' },
  { code: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dialCode: '92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880', flag: '🇧🇩' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸' },
];

const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

const splitPhoneValue = (value) => {
  const normalized = String(value || '').trim().replace(/[^\d+]/g, '');
  if (!normalized) return { country: DEFAULT_COUNTRY, local: '' };

  const digits = normalized.startsWith('+') ? normalized.slice(1) : normalized.replace(/\D/g, '');
  if (!digits) return { country: DEFAULT_COUNTRY, local: '' };

  const sortedCountries = [...COUNTRY_OPTIONS].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  const matched = sortedCountries.find((c) => {
    if (!digits.startsWith(c.dialCode)) return false;
    const localPart = digits.slice(c.dialCode.length);
    return localPart.length >= 0;
  });

  if (matched) {
    return {
      country: matched,
      local: digits.slice(matched.dialCode.length),
    };
  }

  return { country: DEFAULT_COUNTRY, local: digits };
};

export default function PhoneNumberInput({
  value,
  onChange,
  placeholder,
  editable = true,
  containerStyle,
  inputStyle,
}) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');

  useEffect(() => {
    const parsed = splitPhoneValue(value);
    setSelectedCountry((prev) => (prev.code === parsed.country.code ? prev : parsed.country));
    setLocalNumber((prev) => (prev === parsed.local ? prev : parsed.local));
  }, [value]);

  const emitPhone = (country, localDigits) => {
    const cleanLocal = String(localDigits || '').replace(/\D/g, '');
    if (!cleanLocal) {
      onChange?.('');
      return;
    }
    onChange?.(`+${country.dialCode}${cleanLocal}`);
  };

  const handleLocalChange = (nextValue) => {
    const clean = nextValue.replace(/\D/g, '');
    setLocalNumber(clean);
    emitPhone(selectedCountry, clean);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryModal(false);
    emitPhone(country, localNumber);
  };

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => editable && setShowCountryModal(true)}
          disabled={!editable}
          activeOpacity={0.7}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>+{selectedCountry.dialCode}</Text>
          <ChevronDown size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={localNumber}
          onChangeText={handleLocalChange}
          keyboardType="phone-pad"
          editable={editable}
        />
      </View>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCountryModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <ScrollView style={styles.countryList}>
              {COUNTRY_OPTIONS.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryItemFlag}>{country.flag}</Text>
                  <Text style={styles.countryItemName}>{country.name}</Text>
                  <Text style={styles.countryItemCode}>+{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const getStyles = (colors, typography) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.white,
      overflow: 'hidden',
    },
    countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 12,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    countryFlag: {
      fontSize: 16,
    },
    countryCode: {
      color: colors.text,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.fontSize.sm,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.base,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxHeight: '70%',
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
    },
    modalTitle: {
      color: colors.text,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: typography.fontSize.lg,
      marginBottom: 12,
    },
    countryList: {
      maxHeight: 420,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    countryItemFlag: {
      fontSize: 18,
      marginRight: 10,
    },
    countryItemName: {
      flex: 1,
      color: colors.text,
      fontFamily: typography.fontFamily.regular,
      fontSize: typography.fontSize.base,
    },
    countryItemCode: {
      color: colors.textMuted,
      fontFamily: typography.fontFamily.medium,
      fontSize: typography.fontSize.sm,
    },
  });
