/**
 * Auth Redux Slice
 * 
 * CONCEPTS EXPLAINED:
 * 1. Redux Toolkit: Modern way to manage state
 * 2. createSlice: Automatically creates actions and reducers
 * 3. User State: Stores logged-in user data globally
 * 
 * Usage:
 * import { useSelector, useDispatch } from 'react-redux';
 * import { setUser, clearUser } from '../store/slices/authSlice';
 * 
 * const user = useSelector(state => state.auth.user);
 * dispatch(setUser(userData));
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,          // User object: { id, name, email, phone, ... }
  isAuthenticated: false, // Boolean: true if user is logged in
  isLoading: false,   // Boolean: true during auth operations
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user data after successful login/signup
     */
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    /**
     * Clear user data (logout)
     */
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    /**
     * Set loading state during auth operations
     */
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    /**
     * Update user data (e.g., after profile update)
     */
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

// Export actions
export const { setUser, clearUser, setLoading, updateUser } = authSlice.actions;

// Export reducer (will be added to store)
export default authSlice.reducer;

