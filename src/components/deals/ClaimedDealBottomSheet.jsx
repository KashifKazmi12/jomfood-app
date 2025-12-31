import React, { useRef, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  PanResponder, 
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useThemeTypography from '../../theme/useThemeTypography';

const AnimatedView = Animated.createAnimatedComponent(View);
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import useThemeColors from '../../theme/useThemeColors';
import { showToast } from '../toast';
import { X, Calendar, MapPin, DollarSign, Clock, CheckCircle, XCircle, Eye, EyeOff, ExternalLink } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAG_THRESHOLD = 100; // Minimum drag distance to close

export default function ClaimedDealBottomSheet({ visible, onClose, data }) {
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const navigation = useNavigation();
  const [isSaved, setIsSaved] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const qrImageRef = useRef(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(null);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward drags on the drag handle area
        // Check if the touch started near the drag handle (top 60px)
        const touchY = evt.nativeEvent.pageY;
        const isInDragArea = touchY < 100; // Only top 100px
        
        if (isInDragArea && gestureState.dy > 10) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt) => {
        dragStartY.current = evt.nativeEvent.pageY;
        translateY.setOffset(translateY._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        dragStartY.current = null;
        translateY.flattenOffset();
        if (gestureState.dy > DRAG_THRESHOLD) {
          // Close the sheet
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  // Reset saved state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setIsSaved(false);
      translateY.setValue(0);
    } else {
      // Animate in when visible
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [visible]);

  // Debug: Log full data structure
  React.useEffect(() => {
    if (visible && data) {
      console.log('🔍 [ClaimedDealBottomSheet] Full Data Structure:', {
        keys: Object.keys(data),
        qr_code_public_url: data.qr_code_public_url,
        qr_code_image: data.qr_code_image ? data.qr_code_image.substring(0, 50) + '...' : null,
        deal_name: data.deal_name,
        status: data.status,
      });
    }
  }, [visible, data]);

  // Debug: Log QR code data
  React.useEffect(() => {
    if (visible && data) {
      const qrCodeUrl = data.qr_code_public_url || data.qr_code_image;
      console.log('🔍 [ClaimedDealBottomSheet] QR Code Data:', {
        has_qr_code_public_url: !!data.qr_code_public_url,
        has_qr_code_image: !!data.qr_code_image,
        qr_code_public_url: data.qr_code_public_url,
        qr_code_image_type: data.qr_code_image?.substring(0, 20),
        final_qrCodeUrl: qrCodeUrl?.substring(0, 50),
      });
    }
  }, [visible, data]);

  // Early return after all hooks
  if (!data) {
    console.log('⚠️ [ClaimedDealBottomSheet] No data provided');
    return null;
  }

  const onSaveToGallery = async () => {
    try {
      if (!qrImageRef.current) {
        return;
      }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'redeemed': return colors.info;
      case 'expired': return colors.textMuted;
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    const statusColor = getStatusColor(status);
    switch (status) {
      case 'active': return <Clock size={16} color={statusColor} />;
      case 'redeemed': return <CheckCircle size={16} color={statusColor} />;
      case 'expired': return <XCircle size={16} color={statusColor} />;
      case 'cancelled': return <XCircle size={16} color={statusColor} />;
      default: return <Clock size={16} color={statusColor} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const businessName = data.business_id?.company_name || data.group_id?.name || 'Unknown Business';
  const dealName = data.deal_name || 'Deal';
  const dealPrice = data.deal_total || 0;
  const qrCodeUrl = data.qr_code_public_url || data.qr_code_image;
  const dealId = data.deal_id;

  const handleViewDealDetails = () => {
    if (dealId) {
      onClose(); // Close the bottom sheet first
      navigation.navigate('DealDetail', { id: dealId });
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <AnimatedView 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle - Only this area responds to drag */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.dealName} numberOfLines={2}>{dealName}</Text>
              <Text style={styles.businessName}>{businessName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) + '20' }]}>
                {getStatusIcon(data.status)}
                <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                  {data.status?.charAt(0).toUpperCase() + data.status?.slice(1) || 'Active'}
                </Text>
              </View>

              {/* QR Code Section - Always show */}
              <View style={styles.qrSection}>
                <Text style={styles.sectionTitle}>QR Code</Text>
                {qrCodeUrl ? (
                  <>
                    <View style={styles.qrContainer}>
                      <ViewShot ref={qrImageRef} options={{ format: 'png', quality: 1.0 }}>
                        <Image
                          source={{ uri: qrCodeUrl }}
                          style={styles.qrImage}
                          resizeMode="contain"
                          onError={(error) => {
                            console.error('❌ [ClaimedDealBottomSheet] QR Image Error:', error);
                            console.error('❌ [ClaimedDealBottomSheet] QR URL was:', qrCodeUrl);
                          }}
                          onLoad={() => {
                            console.log('✅ [ClaimedDealBottomSheet] QR Image Loaded successfully');
                          }}
                        />
                      </ViewShot>
                    </View>
                    <TouchableOpacity
                      style={[styles.saveButton, isSaved && styles.saveButtonDisabled]}
                      onPress={onSaveToGallery}
                      disabled={isSaved}
                    >
                      <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextDisabled]}>
                        {isSaved ? 'Saved' : 'Save to Gallery'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.qrContainer}>
                    <Text style={styles.errorText}>QR Code not available</Text>
                    <Text style={styles.errorSubtext}>
                      {data.qr_code_public_url ? 'Failed to load QR code' : 'No QR code found in data'}
                    </Text>
                    <Text style={[styles.errorSubtext, { marginTop: 8, fontSize: 12 }]}>
                      Debug: qr_code_public_url={data.qr_code_public_url ? 'exists' : 'missing'}, qr_code_image={data.qr_code_image ? 'exists' : 'missing'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Deal Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Deal Information</Text>
                
                <View style={styles.infoRow}>
                  <DollarSign size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Price</Text>
                    <Text style={styles.infoValue}>RM{dealPrice.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Calendar size={18} color={colors.textMuted} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Claimed At</Text>
                    <Text style={styles.infoValue}>{formatDate(data.claimed_at)}</Text>
                  </View>
                </View>

                {data.expires_at && (
                  <View style={styles.infoRow}>
                    <Clock size={18} color={colors.textMuted} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Expires At</Text>
                      <Text style={[styles.infoValue, data.status === 'active' && styles.expiryWarning]}>
                        {formatDate(data.expires_at)}
                      </Text>
                    </View>
                  </View>
                )}

                {data.redeemed_at && (
                  <View style={styles.infoRow}>
                    <CheckCircle size={18} color={colors.info} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Redeemed At</Text>
                      <Text style={styles.infoValue}>{formatDate(data.redeemed_at)}</Text>
                    </View>
                  </View>
                )}

                {data.business_id?.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={18} color={colors.textMuted} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoValue}>{data.business_id.address}</Text>
                    </View>
                  </View>
                )}

                {dealId && (
                  <TouchableOpacity style={styles.viewDealRow} onPress={handleViewDealDetails} activeOpacity={0.7}>
                    <ExternalLink size={18} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.viewDealLabel}>View Deal Details</Text>
                      <Text style={styles.viewDealSubtext}>See what's included in this deal</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* How to Use Section */}
              <View style={styles.howToSection}>
                <View style={styles.howToHeader}>
                  <Text style={styles.sectionTitle}>How to Use</Text>
                  <TouchableOpacity onPress={() => setHowToOpen(v => !v)}>
                    {howToOpen ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>
                {howToOpen && (
                  <View style={styles.howToContent}>
                    <Bullet>Show this QR code to the restaurant staff</Bullet>
                    <Bullet>The QR code will be scanned for verification</Bullet>
                    <Bullet>Your deal will be redeemed automatically</Bullet>
                    <Bullet>Keep this QR code safe until redemption</Bullet>
                  </View>
                )}
              </View>
            </ScrollView>
        </AnimatedView>
      </View>
    </Modal>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    height: SCREEN_HEIGHT * 0.75,
  },
  dragArea: {
    paddingVertical: 8,
    // This area handles drag gestures - only the drag handle
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  dealName: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold, 
    color: colors.text,
    marginBottom: 4,
  },
  businessName: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  qrSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  saveButtonTextDisabled: {
    color: colors.textMuted,
  },
  infoSection: {
    marginTop: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  expiryWarning: {
    color: colors.warning || colors.error,
  },
  errorText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  howToSection: {
    marginTop: 16,
  },
  howToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  howToContent: {
    marginTop: 0,
  },
  viewDealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  viewDealLabel: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 2,
  },
  viewDealSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
});

function Bullet({ children }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
      <Text style={{ color: colors.textMuted, marginRight: 8 }}>•</Text>
      <Text style={{ flex: 1, color: colors.text }}>{children}</Text>
    </View>
  );
}

