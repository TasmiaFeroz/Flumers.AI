// profileSlice.js
// Redux slice for managing user profile state in the application.
// This slice provides initial profile data and a selector for accessing the user profile.
// All state, reducers, and exports are commented for clarity and maintainability.

import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
    name: 'profile', // Name of the slice
    initialState: {
        userProfile: {
            name: 'John Doe', // Default name for demonstration
            email: 'john.doe@example.com' // Default email for demonstration
        }
    },
    reducers: {
        // Selector: Returns the user profile from state
        selectUserProfile: (state) => state.userProfile
    }
});

export const { selectUserProfile } = profileSlice.actions;
export default profileSlice.reducer;