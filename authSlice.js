import { createSlice } from '@reduxjs/toolkit';

// The authSlice.js file defines the Redux slice for managing authentication state.
// It includes actions and reducers for login and logout functionality.

// Define the initial state for authentication
const initialState = {
  user: null, // Stores the authenticated user's information
  isAuthenticated: false, // Indicates whether the user is logged in
  token: null, // Stores the authentication token
};

// Create the authentication slice
const authSlice = createSlice({
  name: 'auth', // Name of the slice
  initialState, // Initial state of the slice
  reducers: {
    // Reducer for handling login action
    login(state, action) {
      const { user, token } = action.payload; // Extract user and token from the action payload
      state.user = user; // Update the user state
      state.token = token; // Update the token state
      state.isAuthenticated = true; // Set authentication status to true
      localStorage.setItem('token', token); // Store the token in localStorage
    },
    // Reducer for handling logout action
    logout(state) {
      state.user = null; // Clear the user state
      state.token = null; // Clear the token state
      state.isAuthenticated = false; // Set authentication status to false
      localStorage.removeItem('token'); // Remove the token from localStorage
    },
    setUserFromToken(state, action) {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
    },
  },
});

// Export the actions and reducer
export const { login, logout, setUserFromToken } = authSlice.actions;
export default authSlice.reducer;