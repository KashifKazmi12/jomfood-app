import React, { useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import useThemeColors from '../../theme/useThemeColors';
import { showToast } from '../toast';
import { Eye, EyeOff, X } from 'lucide-react-native';
import useThemeTypography from '../../theme/useThemeTypography';

export default function ClaimedDealModal({ visible, onClose, data, showHowToUse = false }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const [howToOpen, setHowToOpen] = React.useState(showHowToUse);
  const [isSaved, setIsSaved] = React.useState(false);
  const qrImageRef = useRef(null);

  // Reset saved state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setIsSaved(false);
    }
  }, [visible]);

  if (!data) return null;

  const onSaveToGallery = async () => {
    try {
      if (!qrImageRef.current) {
        showToast.error('Error', 'QR code image not ready');
        return;
      }

      // Capture the QR code image view as a file
      const uri = await qrImageRef.current.capture();
      
      // Create a sanitized filename from deal name
      const dealName = data.deal_name || 'QR_Code';
      const sanitizedName = dealName
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      const timestamp = Date.now();
      const filename = `${sanitizedName}_${timestamp}.png`;
      
      // Create a temporary file path with the custom filename
      const tempPath = `${RNFS.CachesDirectoryPath}/${filename}`;
      
      // Copy the captured image to the new file with custom name
      // Handle both 'file://' prefixed and non-prefixed URIs
      const sourcePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      await RNFS.copyFile(sourcePath, tempPath);
      
      // Save to gallery using CameraRoll with the custom filename
      // On Android 10+ (API 29+), saving images uses scoped storage and doesn't require READ_MEDIA_IMAGES permission
      await CameraRoll.save(`file://${tempPath}`, { type: 'photo' });
      
      // Clean up temporary file
      try {
        await RNFS.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.log('Cleanup error (non-critical):', cleanupError);
      }
      
      setIsSaved(true);
      showToast.success('Success', 'QR code saved to gallery');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      showToast.error('Error', 'Failed to save to gallery');
    }
  };


  const expiryStr = data.expires_at ? new Date(data.expires_at).toLocaleString() : '-';
  const claimedAtStr = data.claimed_at ? new Date(data.claimed_at).toLocaleString() : '-';

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Deal Claimed Successfully!</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.qrWrap}>
              <ViewShot ref={qrImageRef} options={{ format: 'png', quality: 1.0 }}>
                <Image source={{ uri: data.qr_code }} style={styles.qrImage} resizeMode="contain" />
              </ViewShot>
              <TouchableOpacity 
                style={[styles.downloadBtn, isSaved && styles.downloadBtnDisabled]} 
                onPress={onSaveToGallery}
                disabled={isSaved}
              >
                <Text style={styles.downloadText}>{isSaved ? 'Saved' : 'Save to Gallery'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deal Details</Text>
              <Row style={styles.row} label="Deal Name" value={data.deal_name} />
              <Row style={styles.row} label="Total Amount" value={formatPrice(data.deal_total)} />
              <Row style={styles.row} label="Deal Type" value={capitalize(data.deal_type)} />
              <Row style={styles.row} label="Expires At" value={expiryStr} />
              <Row style={styles.row} label="Status" value={capitalize(data.status || '-')} />
              <Row style={styles.row} label="Claimed At" value={claimedAtStr} />
              {/* <Row label="Claim ID" value={data.claim_id} mono /> */}
            </View>


            <View style={styles.section}>
              <View style={styles.howToHeader}>
                <Text style={styles.sectionTitle}>How to Use</Text>
                <TouchableOpacity onPress={() => setHowToOpen(v => !v)}>
                  {howToOpen ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
              {howToOpen && (
                <View style={{ marginTop: 8 }}>
                  <Bullet>Show this QR code to the restaurant staff</Bullet>
                  <Bullet>The QR code will be scanned for verification</Bullet>
                  <Bullet>Your deal will be redeemed automatically</Bullet>
                  <Bullet>Keep this QR code safe until redemption</Bullet>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, mono }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
      <Text style={{ color: '#6B7280' }}>{label}:</Text>
      <Text style={{ color: '#111827', fontFamily: mono ? (Platform.OS === 'ios' ? 'Menlo' : 'monospace') : undefined }} numberOfLines={1}>
        {value ?? '-'}
      </Text>
    </View>
  );
}

function Bullet({ children }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
      <Text style={{ color: '#6B7280', marginRight: 8 }}>•</Text>
      <Text style={{ flex: 1, color: '#374151' }}>{children}</Text>
    </View>
  );
}

function formatPrice(n) {
  if (typeof n === 'number') return `RM ${n.toFixed(2)}`;
  return '-';
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return '-';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const getStyles = (colors, typography) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
  },
  content: { padding: 14, paddingBottom: 24 },
  qrWrap: { alignItems: 'center' },
  qrImage: { width: 180, height: 180, backgroundColor: '#fff', borderRadius: 8 },
  downloadBtn: { 
    marginTop: 10,
    width: '100%',
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  downloadBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.7,
  },
  downloadText: { color: colors.white, fontFamily: typography.fontFamily.semiBold, fontSize: 16 },
  section: { marginTop: 16, marginHorizontal: 12 },
  sectionTitle: { color: colors.textMuted, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md },
  value: { marginTop: 6, color: colors.text, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.regular },
  valueMuted: { color: colors.textMuted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.lg },
  howToHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  closeBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  closeText: { color: colors.text, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base },
  row: { color: colors.text, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base },
});

