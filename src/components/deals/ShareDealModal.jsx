import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Share, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import useThemeColors from '../../theme/useThemeColors';
import useThemeTypography from '../../theme/useThemeTypography';
import { shareWhatsAppMessage } from '../../utils/whatsapp';
import { showToast } from '../toast';

export default function ShareDealModal({ visible, onClose, link, message }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = useMemo(() => getStyles(colors, typography), [colors, typography]);

  const handleShareMore = async () => {
    try {
      await Share.share({ message });
    } catch (error) {
      showToast.error('Error', 'Could not open share sheet');
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      await shareWhatsAppMessage(message);
    } catch (error) {
      showToast.error('Error', 'Could not open WhatsApp');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Share deal</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Share this link with others:</Text>
          <View style={styles.linkBox}>
            <Text numberOfLines={1} style={styles.linkText}>{link}</Text>
          </View>
          <Text style={styles.subtitle}>Share via:</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.whatsAppButton} onPress={handleShareWhatsApp}>
              <Text style={styles.whatsAppText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton} onPress={handleShareMore}>
              <Text style={styles.moreText}>More apps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '88%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  closeText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 6,
  },
  linkBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.backgroundLight || '#F5F5F5',
  },
  linkText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  whatsAppButton: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  moreButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
});
