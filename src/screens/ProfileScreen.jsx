import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useThemeColors from '../theme/useThemeColors';
import useThemeTypography from '../theme/useThemeTypography';
import { clearUser, updateUser } from '../store/slices/authSlice';
import authAPI from '../api/auth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import { showToast } from '../components/toast';
import { Lock, Edit2, X, Save, LogOut, Bell, Globe, Share2, Camera, Copy, Link2 } from 'lucide-react-native';
import useLanguage from '../i18n/useLanguage';
import LoginPrompt from '../components/LoginPrompt';
import { useTranslation } from 'react-i18next';
import { removeCustomerIdFromFCMToken } from '../utils/initializeNotifications';
import { launchImageLibrary } from 'react-native-image-picker';
import PhoneNumberInput from '../components/common/PhoneNumberInput';
import Clipboard from '@react-native-clipboard/clipboard';
import { buildSignupInviteUrl } from '../config/referralInvite';

function profileDisplayInitials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || '';
  const s = `${a}${b}`.toUpperCase();
  return s || '?';
}

export default function ProfileScreen() {
  const APP_STORE_URL = 'https://apps.apple.com/us/app/jomfood/id6757225361';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jomfood';
  const user = useSelector(state => state.auth.user);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const styles = getStyles(colors, typography);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { currentLanguage, changeLanguage, getLanguages } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // State for modals
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [editErrors, setEditErrors] = useState({ name: '', phone: '' });

  // Form states
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarBusy, setAvatarBusy] = useState(false);

  // Fetch user profile data
  const { data: profileData, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user?._id) return null;
      return await authAPI.getMe();
    },
    enabled: !!user?._id,
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileData) {
      setEditForm({
        name: profileData.name || user?.name || '',
        phone: profileData.phone || user?.phone || '',
      });
    }
  }, [profileData, user?.name, user?.phone]);

  // Edit profile mutation
  const editProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await authAPI.editProfile(data);
    },
    onSuccess: (response) => {
      if (response.user) {
        dispatch(updateUser(response.user));
        queryClient.setQueryData(['user-profile'], response.user);
        showToast.success(t('common.profileUpdated'), t('common.profileUpdatedSuccess'));
        setEditProfileVisible(false);
      }
    },
    onError: (error) => {
      showToast.error(t('common.updateFailed'), error.message || t('common.failedToUpdateProfile'));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return await authAPI.changePassword(data.oldPassword, data.newPassword);
    },
    onSuccess: () => {
      showToast.success(t('common.passwordChanged'), t('common.passwordChangedSuccess'));
      setChangePasswordVisible(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      showToast.error(t('common.passwordChangeFailed'), error.message || t('common.failedToChangePassword'));
    },
  });

  // Get user ID and profile info
  const userId = user?._id;
  const currentUser = profileData || user;
  const displayInitials = useMemo(
    () => profileDisplayInitials(currentUser?.name),
    [currentUser?.name]
  );
  const canUsePassword = currentUser?.canUsePassword ?? false;

  // Force re-render when screen comes into focus (fixes Google Sign-In state sync issue)
  useFocusEffect(
    React.useCallback(() => {
      // This will cause the component to re-render when the screen comes into focus
      // This ensures the user state is properly synced after Google Sign-In
      if (userId) {
        refetchProfile();
      }
    }, [userId, refetchProfile])
  );

  // Handle edit profile
  const handleEditProfile = () => {
    const errors = { name: '', phone: '' };

    if (!editForm.name.trim()) {
      errors.name = t('common.nameRequired');
    }

    setEditErrors(errors);

    const hasErrors = errors.name;
    if (hasErrors) {
      return;
    }

    editProfileMutation.mutate({
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
    });
  };

  // Handle change password
  const handleChangePassword = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      showToast.error(t('common.validationError'), t('common.allPasswordFieldsRequired'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast.error(t('common.validationError'), t('common.passwordMinLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast.error(t('common.validationError'), t('common.passwordsDoNotMatch'));
      return;
    }
    changePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const pickProfilePhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.85,
        maxWidth: 1600,
        maxHeight: 1600,
      },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.uri) return;
        setAvatarBusy(true);
        try {
          const url = await authAPI.uploadImage({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || 'profile.jpg',
          });
          const editRes = await authAPI.editProfile({ image: url });
          if (editRes?.user) {
            dispatch(updateUser(editRes.user));
            queryClient.setQueryData(['user-profile'], editRes.user);
          }
          showToast.success(t('common.profileUpdated'), t('common.profileUpdatedSuccess'));
        } catch (error) {
          showToast.error(
            t('common.updateFailed'),
            error?.message || t('common.failedToUpdateProfile')
          );
        } finally {
          setAvatarBusy(false);
        }
      }
    );
  };

  const clearProfilePhoto = () => {
    Alert.alert(
      t('common.removePhoto', 'Remove photo?'),
      t('common.removePhotoHint', 'Your initials will show until you add a new photo.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.remove', 'Remove'),
          style: 'destructive',
          onPress: async () => {
            setAvatarBusy(true);
            try {
              const editRes = await authAPI.editProfile({ image: null });
              if (editRes?.user) {
                dispatch(updateUser(editRes.user));
                queryClient.setQueryData(['user-profile'], editRes.user);
              }
              showToast.success(t('common.profileUpdated'), t('common.profileUpdatedSuccess'));
            } catch (error) {
              showToast.error(
                t('common.updateFailed'),
                error?.message || t('common.failedToUpdateProfile')
              );
            } finally {
              setAvatarBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('common.deleteAccountConfirmTitle', 'Delete account?'),
      t('common.deleteAccountConfirmMessage', 'This will permanently delete your account.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.deleteAccountConfirmAction', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.deleteAccount();
              try {
                await removeCustomerIdFromFCMToken();
              } catch (error) {
                console.warn('⚠️ Failed to remove customerId from FCM token:', error);
              }
              await authAPI.logout();
              dispatch(clearUser());
              showToast.success(
                t('common.deleteAccountSuccess', 'Account deleted'),
                t('common.deleteAccountSuccessMessage', 'Your account has been deleted.')
              );
              navigation.navigate('Home');
            } catch (error) {
              showToast.error(
                t('common.deleteAccountFailed', 'Delete failed'),
                error.message || t('common.failedToDeleteAccount', 'Failed to delete account')
              );
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      await Share.share({
        message: `${t('common.shareAppMessage', 'Download JomFood app:')} ${storeUrl}`,
      });
    } catch (error) {
      showToast.error(
        t('common.shareFailed', 'Share failed'),
        error?.message || t('common.tryAgain', 'Please try again')
      );
    }
  };

  const referralCode = currentUser?.referralCode || '';
  const referralCount =
    typeof currentUser?.referralCount === 'number' ? currentUser.referralCount : 0;
  const inviteUrl = referralCode ? buildSignupInviteUrl(referralCode) : '';

  const copyReferralCode = async () => {
    if (!referralCode) return;
    try {
      await Clipboard.setString(referralCode);
      showToast.success(t('common.success', 'Success'), t('referral.codeCopied', 'Referral code copied'));
    } catch {
      showToast.error(t('common.error', 'Error'), t('referral.copyFailed', 'Could not copy'));
    }
  };

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      await Clipboard.setString(inviteUrl);
      showToast.success(t('common.success', 'Success'), t('referral.linkCopied', 'Invite link copied'));
    } catch {
      showToast.error(t('common.error', 'Error'), t('referral.copyFailed', 'Could not copy'));
    }
  };

  const shareReferralInvite = async () => {
    if (!inviteUrl) return;
    try {
      await Share.share({
        title: t('referral.shareTitle', 'Sign up with JomFood'),
        message: t('referral.shareInviteFull', 'Hey! Sign up with JomFood and order the best deal for you. Please use this referral code: {{code}}\n\n{{url}}', {
          code: referralCode,
          url: inviteUrl,
        }),
        url: inviteUrl,
      });
    } catch (error) {
      if (error?.message && !String(error.message).toLowerCase().includes('cancel')) {
        showToast.error(
          t('common.shareFailed', 'Share failed'),
          error?.message || t('common.tryAgain', 'Please try again')
        );
      }
    }
  };

  if (!userId) {
    return (
      <GradientBackground>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
              <LoginPrompt message={t('common.pleaseSignIn')} />

              {/* Language Switcher for non-logged in users */}
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setLanguageModalVisible(true)}
                >
                  <Globe size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>{t('common.selectLanguage')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShareApp}
                >
                  <Share2 size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>{t('common.shareApp')}</Text>
                </TouchableOpacity>

                {/* Test button to log env variables */}
                {/* <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    console.log('API_BASE_URL:', process.env.API_BASE_URL);
                    console.log('WEB_BASE_URL:', process.env.WEB_BASE_URL);
                  }}
                >
                  <Text style={styles.actionButtonText}>Log env variables</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Language Selection Modal for non-logged in users */}
        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.languageModalOverlay}
            activeOpacity={1}
            onPress={() => setLanguageModalVisible(false)}
          >
            <View style={styles.languageModalContent}>
              <Text style={styles.languageModalTitle}>{t('common.selectLanguage')}</Text>

              {getLanguages().map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={async () => {
                    await changeLanguage(lang.code);
                    setLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      currentLanguage === lang.code && styles.languageNameActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {currentLanguage === lang.code && (
                    <Text style={styles.languageCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </GradientBackground>
    );
  }

  if (isLoadingProfile) {
    return (
      <GradientBackground>
        <View style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeContent} edges={['top']}>
        <View style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={pickProfilePhoto}
                  onLongPress={currentUser?.image ? clearProfilePhoto : undefined}
                  disabled={avatarBusy}
                  activeOpacity={0.88}
                  delayLongPress={480}
                  accessibilityLabel={t('common.changePhoto', 'Change profile photo')}
                  accessibilityHint={
                    currentUser?.image
                      ? t('common.removePhotoHint', 'Long-press to remove photo')
                      : undefined
                  }
                >
                  {avatarBusy ? (
                    <View style={[styles.avatarPlaceholder, styles.avatarBusyWrap]}>
                      <ActivityIndicator color={colors.white} />
                    </View>
                  ) : currentUser?.image ? (
                    <Image source={{ uri: currentUser.image }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{displayInitials}</Text>
                    </View>
                  )}
                  {!avatarBusy && (
                    <View style={styles.avatarCameraOverlay} pointerEvents="none">
                      <Camera size={19} color="rgba(90, 90, 90, 0.34)" strokeWidth={1.65} />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentUser?.name || 'User'}</Text>
                  <Text style={styles.profileEmail} numberOfLines={2}>
                    {currentUser?.email || ''}
                  </Text>
                  <Text style={styles.profilePhone}>{currentUser?.phone || t('common.notSet')}</Text>
                </View>
              </View>

              {/* Edit profile first — primary action before referrals and other settings */}
              <View style={styles.actionsSectionLead}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditForm({
                      name: currentUser?.name || '',
                      phone: currentUser?.phone || '',
                    });
                    setEditProfileVisible(true);
                  }}
                >
                  <Edit2 size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>{t('common.editProfile')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.referralCard}>
                <Text style={styles.referralKicker}>{t('referral.sectionLabel', 'REFERRALS')}</Text>
                <Text style={styles.referralTitle}>{t('referral.inviteFriends', 'Invite friends')}</Text>
                <Text style={styles.referralDesc}>
                  {t(
                    'referral.description',
                    'When someone signs up with your referral code, your referral count increases.'
                  )}
                </Text>
                <View style={styles.referralCodeRow}>
                  <Text style={styles.referralCodeText} numberOfLines={1} selectable>
                    {referralCode || '—'}
                  </Text>
                  <TouchableOpacity
                    onPress={copyReferralCode}
                    disabled={!referralCode}
                    style={[styles.referralIconBtn, !referralCode && styles.referralIconBtnDisabled]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Copy size={18} color={referralCode ? colors.textMuted : colors.border} />
                  </TouchableOpacity>
                </View>
                <View style={styles.referralActions}>
                  <TouchableOpacity
                    style={[styles.referralSecondaryBtn, !inviteUrl && styles.referralBtnDisabled]}
                    onPress={copyInviteLink}
                    disabled={!inviteUrl}
                  >
                    <Link2 size={16} color={colors.text} />
                    <Text style={styles.referralSecondaryBtnText}>{t('referral.copyLink', 'Copy link')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.referralPrimaryBtn, !inviteUrl && styles.referralBtnDisabled]}
                    onPress={shareReferralInvite}
                    disabled={!inviteUrl}
                  >
                    <Share2 size={16} color={colors.white} />
                    <Text style={styles.referralPrimaryBtnText}>{t('common.share', 'Share')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.referralStatRow}>
                  <Text style={styles.referralStatLabel}>
                    {t('referral.successfulReferrals', 'Successful referrals')}
                  </Text>
                  <Text style={styles.referralStatValue}>{referralCount}</Text>
                </View>
              </View>

              {/* Remaining settings & actions */}
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setLanguageModalVisible(true)}
                >
                  <Globe size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>{t('common.selectLanguage')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    navigation.navigate('Notifications');
                  }}
                >
                  <Bell size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>{t('notifications.notifications')}</Text>
                </TouchableOpacity>

                {canUsePassword && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      setChangePasswordVisible(true);
                    }}
                  >
                    <Lock size={20} color={colors.primary} />
                    <Text style={styles.actionButtonText}>{t('common.changePassword')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShareApp}
                >
                  <Share2 size={20} color={colors.primary} />
                  <Text style={styles.actionButtonText}>
                    {t('common.shareApp', 'Share App')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDeleteAccount}
                >
                  <LogOut size={20} color={colors.textMuted} />
                  <Text style={styles.actionButtonText}>
                    {t('common.deleteAccount', 'Delete Account')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.logoutButton]}
                  onPress={async () => {
                    // Remove customerId from FCM token before logout
                    try {
                      await removeCustomerIdFromFCMToken();
                    } catch (error) {
                      console.warn('⚠️ Failed to remove customerId from FCM token:', error);
                    }

                    await authAPI.logout();
                    dispatch(clearUser());
                    navigation.navigate('Home');
                  }}
                >
                  <LogOut size={20} color={colors.white} />
                  <Text style={[styles.actionButtonText, styles.logoutButtonText]}>{t('common.logout')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Edit Profile Modal */}
          <Modal
            visible={editProfileVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEditProfileVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            >
              <TouchableWithoutFeedback onPress={() => setEditProfileVisible(false)}>
                <View style={styles.modalBackdrop} />
              </TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('common.editProfile')}</Text>
                  <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('common.name')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('common.enterYourName')}
                      placeholderTextColor={colors.textMuted}
                      value={editForm.name}
                      onChangeText={(value) => {
                        setEditForm({ ...editForm, name: value });
                        setEditErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      autoCapitalize="words"
                    />
                    {editErrors.name ? <Text style={styles.errorText}>{editErrors.name}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('common.phone')}</Text>
                    <PhoneNumberInput
                      value={editForm.phone}
                      onChange={(value) => {
                        setEditForm({ ...editForm, phone: value });
                        setEditErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder={t('common.enterYourPhoneNumber')}
                    />
                    {editErrors.phone ? <Text style={styles.errorText}>{editErrors.phone}</Text> : null}
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditProfileVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleEditProfile}
                    disabled={editProfileMutation.isPending}
                  >
                    {editProfileMutation.isPending ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <Save size={18} color={colors.white} />
                        <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Change Password Modal */}
          <Modal
            visible={changePasswordVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setChangePasswordVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            >
              <TouchableWithoutFeedback onPress={() => setChangePasswordVisible(false)}>
                <View style={styles.modalBackdrop} />
              </TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('common.changePassword')}</Text>
                  <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('common.currentPassword')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('common.enterCurrentPassword')}
                      placeholderTextColor={colors.textMuted}
                      value={passwordForm.oldPassword}
                      onChangeText={(value) => setPasswordForm({ ...passwordForm, oldPassword: value })}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('common.newPassword')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('common.enterNewPassword')}
                      placeholderTextColor={colors.textMuted}
                      value={passwordForm.newPassword}
                      onChangeText={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t('common.confirmNewPassword')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('common.confirmNewPasswordPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={passwordForm.confirmPassword}
                      onChangeText={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setChangePasswordVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <Save size={18} color={colors.white} />
                        <Text style={styles.saveButtonText}>{t('common.changePassword')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Language Selection Modal */}
          <Modal
            visible={languageModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setLanguageModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.languageModalOverlay}
              activeOpacity={1}
              onPress={() => setLanguageModalVisible(false)}
            >
              <View style={styles.languageModalContent}>
                <Text style={styles.languageModalTitle}>{t('common.selectLanguage')}</Text>

                {getLanguages().map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      currentLanguage === lang.code && styles.languageOptionActive,
                    ]}
                    onPress={async () => {
                      await changeLanguage(lang.code);
                      setLanguageModalVisible(false);
                    }}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageName,
                        currentLanguage === lang.code && styles.languageNameActive,
                      ]}
                    >
                      {lang.name}
                    </Text>
                    {currentLanguage === lang.code && (
                      <Text style={styles.languageCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getStyles = (colors, typography) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  safeContent: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    paddingBottom: 100,
  },
  container: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarBusyWrap: {
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarCameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 0,
  },
  profileName: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  profilePhone: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  referralCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  referralKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 4,
  },
  referralTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  referralDesc: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  referralCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    marginBottom: 10,
  },
  referralCodeText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  referralIconBtn: {
    padding: 4,
  },
  referralIconBtnDisabled: {
    opacity: 0.35,
  },
  referralActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  referralSecondaryBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  referralSecondaryBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  referralPrimaryBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  referralPrimaryBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  referralBtnDisabled: {
    opacity: 0.4,
  },
  referralStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  referralStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
  },
  referralStatValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text,
  },
  actionsSectionLead: {
    gap: 12,
    marginBottom: 12,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  logoutButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginTop: 8,
  },
  logoutButtonText: {
    color: colors.white,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semiBold,
  },
  errorText: {
    marginTop: 6,
    color: colors.error || '#d32f2f',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.backgroundLight,
  },
  languageOptionActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  languageNameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  languageCheckmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
