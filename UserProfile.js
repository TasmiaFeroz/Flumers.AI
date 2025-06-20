// UserProfile.js
// This component allows a user to view and edit their own profile (name and bio).
// All state, effects, functions, and UI/CSS blocks are commented for clarity and maintainability.

import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Avatar, Button, TextField } from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../api/firebaseConfig';

const UserProfile = () => {
  // State: Stores the current user's profile data fetched from Firestore
  const [userData, setUserData] = useState(null);
  // State: Controls whether the profile is in edit mode
  const [isEditing, setIsEditing] = useState(false);
  // State: Stores form data for editing name and bio
  const [formData, setFormData] = useState({ name: '', bio: '' });

  // Effect: Fetches user data from Firestore on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setFormData({
            name: userDoc.data().name || '',
            bio: userDoc.data().bio || '',
          });
        }
      }
    };

    fetchUserData();
  }, []);

  // Handler: Toggles edit mode on and off
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  // Handler: Updates form data state on input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler: Saves updated user data to Firestore and updates local state
  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setUserData((prev) => ({ ...prev, ...formData }));
      setIsEditing(false);
    }
  };

  // Loader: Displays a loading message while user data is being fetched
  if (!userData) {
    return <Typography>Loading...</Typography>;
  }

  // UI: Renders the user profile or the edit form based on isEditing state
  return (
    <Container style={{ marginTop: '30px' }}>
      <Paper style={{ padding: '20px', borderRadius: '15px' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid>
            <Avatar style={{ width: '80px', height: '80px' }}>{userData.name?.[0]}</Avatar>
          </Grid>
          <Grid>
            {isEditing ? (
              <>
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  style={{ marginBottom: '10px' }}
                />
                <TextField
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </>
            ) : (
              <>
                <Typography variant="h5">{userData.name}</Typography>
                <Typography variant="body1" color="textSecondary">
                  {userData.bio}
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
        <Grid container spacing={2} style={{ marginTop: '20px' }}>
          <Grid>
            {isEditing ? (
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleEditToggle}>
                Edit Profile
              </Button>
            )}
          </Grid>
          {isEditing && (
            <Grid>
              <Button variant="outlined" color="secondary" onClick={handleEditToggle}>
                Cancel
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default UserProfile;