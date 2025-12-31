/**
 * Privacy Policy Screen
 * 
 * Displays the privacy policy in a readable, scrollable format
 * with standard privacy policy design patterns
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);

  // Get current date for "Last updated"
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('privacyPolicy.title')}</Text>
        <Text style={styles.lastUpdated}>
          {t('privacyPolicy.lastUpdated')}: {currentDate}
        </Text>
      </View>

      {/* Introduction */}
      <View style={styles.section}>
        <Text style={styles.introText}>{t('privacyPolicy.introduction')}</Text>
      </View>

      {/* Section 1: Information We Collect */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. {t('privacyPolicy.section1Title')}</Text>
        
        <Text style={styles.subsectionTitle}>1.1 {t('privacyPolicy.personalInformation')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.personalInformationDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletName')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletEmail')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletPhone')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletLocation')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletAccount')}</Text>
        </View>

        <Text style={styles.subsectionTitle}>1.2 {t('privacyPolicy.usageData')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.usageDataDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletIP')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletBrowser')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletDevice')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletPages')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.bulletCookies')}</Text>
        </View>

        <Text style={styles.subsectionTitle}>1.3 {t('privacyPolicy.thirdPartyData')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.thirdPartyDataDesc')}</Text>
      </View>

      {/* Section 2: How We Use Your Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. {t('privacyPolicy.section2Title')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use3')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use4')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use5')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use6')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.use7')}</Text>
        </View>
      </View>

      {/* Section 3: Cookies & Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. {t('privacyPolicy.section3Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.cookiesDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.cookie1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.cookie2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.cookie3')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.cookie4')}</Text>
        </View>
        <Text style={styles.bodyText}>{t('privacyPolicy.cookiesNote')}</Text>
      </View>

      {/* Section 4: Sharing of Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. {t('privacyPolicy.section4Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.noSell')}</Text>
        
        <Text style={styles.subsectionTitle}>4.1 {t('privacyPolicy.restaurantPartners')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.restaurantPartnersDesc')}</Text>

        <Text style={styles.subsectionTitle}>4.2 {t('privacyPolicy.thirdPartyTools')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.thirdPartyToolsDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.tool1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.tool2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.tool3')}</Text>
        </View>

        <Text style={styles.subsectionTitle}>4.3 {t('privacyPolicy.legalCompliance')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.legalComplianceDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.legal1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.legal2')}</Text>
        </View>
      </View>

      {/* Section 5: Data Protection & Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. {t('privacyPolicy.section5Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.securityDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.security1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.security2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.security3')}</Text>
        </View>
        <Text style={styles.bodyText}>{t('privacyPolicy.securityNote')}</Text>
      </View>

      {/* Section 6: Your Rights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. {t('privacyPolicy.section6Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.rightsDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.right1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.right2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.right3')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.right4')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.right5')}</Text>
        </View>
        <Text style={styles.bodyText}>{t('privacyPolicy.rightsContact')}</Text>
      </View>

      {/* Section 7: Third-Party Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. {t('privacyPolicy.section7Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.thirdPartyLinksDesc')}</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.link1')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.link2')}</Text>
          <Text style={styles.bulletItem}>• {t('privacyPolicy.link3')}</Text>
        </View>
        <Text style={styles.bodyText}>{t('privacyPolicy.thirdPartyLinksNote')}</Text>
      </View>

      {/* Section 8: Children's Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. {t('privacyPolicy.section8Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.childrenDesc')}</Text>
      </View>

      {/* Section 9: Changes to This Privacy Policy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. {t('privacyPolicy.section9Title')}</Text>
        <Text style={styles.bodyText}>{t('privacyPolicy.changesDesc')}</Text>
      </View>

      {/* Contact Section */}
      <View style={[styles.section, styles.contactSection]}>
        <Text style={styles.sectionTitle}>{t('privacyPolicy.contactUs')}</Text>
        <Text style={styles.bodyText}>
          {t('privacyPolicy.contactDescription')}{' '}
          <TouchableOpacity onPress={() => Linking.openURL('mailto:info@jomfood.my')}>
            <Text style={[styles.emailLink, { color: colors.primary }]}>info@jomfood.my</Text>
          </TouchableOpacity>
        </Text>
      </View>

      {/* Footer spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  footer: {
    height: 20,
  },
  contactSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emailLink: {
    fontFamily: typography.fontFamily.semiBold,
    textDecorationLine: 'underline',
  },
});

