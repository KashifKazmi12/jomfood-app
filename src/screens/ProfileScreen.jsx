import React, { useState, useEffect } from 'react';
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
import { User, Mail, Phone, Lock, Edit2, X, Save, LogOut, Bell, Globe } from 'lucide-react-native';
import useLanguage from '../i18n/useLanguage';
import LoginPrompt from '../components/LoginPrompt';
import { useTranslation } from 'react-i18next';
import { removeCustomerIdFromFCMToken } from '../utils/initializeNotifications';

export default function ProfileScreen() {
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
  }, [profileData]);

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
  const canUsePassword = currentUser?.canUsePassword ?? false;
  const canUseGoogle = currentUser?.canUseGoogle ?? false;

  // Force re-render when screen comes into focus (fixes Google Sign-In state sync issue)
  useFocusEffect(
    React.useCallback(() => {
      // This will cause the component to re-render when the screen comes into focus
      // This ensures the user state is properly synced after Google Sign-In
      if (userId) {
        refetchProfile();
      }
    }, [user, userId, refetchProfile])
  );

  // Handle edit profile
  const handleEditProfile = () => {
    const errors = { name: '', phone: '' };

    if (!editForm.name.trim()) {
      errors.name = t('common.nameRequired');
    }
    if (!editForm.phone.trim()) {
      errors.phone = t('common.phoneRequired');
    }

    setEditErrors(errors);

    const hasErrors = errors.name || errors.phone;
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
          }
        }
      ]
    );
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
              <View style={styles.avatarContainer}>
                {currentUser?.image ? (
                  <Image source={{ uri: currentUser.image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(currentUser?.name || 'U').substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{currentUser?.name || 'User'}</Text>
                <Text style={styles.profileEmail}>{currentUser?.email || ''}</Text>
              </View>
            </View>

            {/* Profile Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('common.profileInformation')}</Text>
              
              <View style={styles.infoRow}>
                <Mail size={20} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('common.email')}</Text>
                  <Text style={styles.infoValue}>{currentUser?.email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Phone size={20} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('common.phone')}</Text>
                  <Text style={styles.infoValue}>{currentUser?.phone || t('common.notSet')}</Text>
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <Lock size={20} color={colors.textMuted} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Authentication</Text>
                  <Text style={styles.infoValue}>
                    {canUseGoogle && canUsePassword ? 'Google & Password' : 
                     canUseGoogle ? 'Google' : 
                     canUsePassword ? 'Password' : 'N/A'}
                  </Text>
                </View>
              </View> */}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
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
                    <TextInput
                      style={styles.input}
                      placeholder={t('common.enterYourPhoneNumber')}
                      placeholderTextColor={colors.textMuted}
                      value={editForm.phone}
                      onChangeText={(value) => {
                        setEditForm({ ...editForm, phone: value });
                        setEditErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      keyboardType="phone-pad"
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
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.semiBold,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
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
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 16,
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
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 4,
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
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
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
