import Toast from 'react-native-toast-message';

export const showToast = {
  success: (text1, text2) => Toast.show({ type: 'success', text1, text2 }),
  error: (text1, text2) => Toast.show({ type: 'error', text1, text2 }),
  info: (text1, text2) => Toast.show({ type: 'info', text1, text2 }),
};

export default Toast;


