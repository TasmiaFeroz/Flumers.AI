// InfluencerProfile.js
// This component allows influencers to view and edit their profile, including uploading a profile image, setting bio, niche, email, and managing social media platform data.
// All state, effects, functions, and UI/CSS blocks are commented for clarity and maintainability.

import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Avatar,
  Box,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { db, auth } from "../../api/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { supabase } from "../../api/supabaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// --- Allowed Niches ---
const allowedNiches = [
  "baby_products",
  "beauty_health",
  "clothing_accessories_jewellery",
  "electronics",
  "grocery",
  "hobby_arts_stationery",
  "home_kitchen_tools",
  "pet_supplies",
  "sports_outdoor",
];

// --- InfluencerProfile Component ---
const InfluencerProfile = () => {
  // State: Stores all profile fields for the influencer
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    bio: "",
    niche: "",
    email: "",
    socialLinks: "",
  });
  // State: Stores the preview URL for the uploaded profile image
  const [imagePreview, setImagePreview] = useState("");
  // State: Tracks which social media platforms are selected
  const [platforms, setPlatforms] = useState({
    youtube: false,
    instagram: false,
    tiktok: false,
    twitter: false,
    facebook: false,
  });
  // State: Stores data for each selected platform (followers, watch time, link)
  const [platformData, setPlatformData] = useState({
    youtube: { followers: "", watchTime: "", link: "" },
    instagram: { followers: "", watchTime: "", link: "" },
    tiktok: { followers: "", watchTime: "", link: "" },
    twitter: { followers: "", watchTime: "", link: "" },
    facebook: { followers: "", watchTime: "", link: "" },
  });
  // State: Controls whether the username field is disabled (after first set)
  const [isUsernameDisabled, setIsUsernameDisabled] = useState(false);

  // Effect: Fetches the influencer profile from Firestore on auth state change, and persists to localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchProfile = async () => {
          const userDoc = doc(db, "users", user.uid);
          try {
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
              const profileData = userSnapshot.data();

              // Normalize the niche value to match allowed options
              if (!allowedNiches.includes(profileData.niche)) {
                profileData.niche = profileData.niche.toLowerCase();
                if (!allowedNiches.includes(profileData.niche)) {
                  profileData.niche = ""; // Reset to empty string if still invalid
                }
              }

              // Set profile data and image preview
              setProfile((prevProfile) => {
                if (Object.keys(prevProfile).every((key) => !prevProfile[key])) {
                  return profileData;
                }
                return prevProfile;
              });

              // Decode the image URL to handle double encoding issues
              const decodedImageUrl = decodeURIComponent(profileData.image || "");
              console.log("Decoded image URL:", decodedImageUrl);
              setImagePreview(decodedImageUrl);

              // Add debugging log after setting imagePreview from Firestore
              console.log("Setting imagePreview from Firestore:", decodedImageUrl);

              // Map platforms data from Firestore to state only if state is empty
              setPlatforms((prevPlatforms) => {
                const updatedPlatforms = { ...prevPlatforms };
                Object.keys(profileData.platforms || {}).forEach((platform) => {
                  if (profileData.platforms[platform]) {
                    updatedPlatforms[platform] = true;
                  }
                });
                return updatedPlatforms;
              });

              setPlatformData((prevPlatformData) => {
                const updatedPlatformData = { ...prevPlatformData };
                Object.keys(profileData.platforms || {}).forEach((platform) => {
                  if (profileData.platforms[platform]) {
                    updatedPlatformData[platform] = {
                      followers: profileData.platforms[platform].followers || "",
                      watchTime: profileData.platforms[platform].watchTime || "",
                      link: profileData.platforms[platform].link || "",
                    };
                  }
                });
                return updatedPlatformData;
              });

              if (profileData.username) {
                setIsUsernameDisabled(true);
              }

              localStorage.setItem("profileData", JSON.stringify(profileData));
            } else {
              console.warn("No profile data found for the logged-in user.");
            }
          } catch (error) {
            console.error("Error fetching profile data:", error);
          }
        };

        fetchProfile();
      } else {
        console.error("No user is logged in.");
        const savedProfile = localStorage.getItem("profileData");
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          console.log("Loaded image URL from localStorage:", parsedProfile.image); // Debugging log
          setProfile((prevProfile) => {
            if (Object.keys(prevProfile).every((key) => !prevProfile[key])) {
              return parsedProfile;
            }
            return prevProfile;
          });
          setImagePreview(parsedProfile.image || "");

          // Add debugging log after setting imagePreview from localStorage
          console.log("Setting imagePreview from localStorage:", parsedProfile.image || "");
        }
      }
    });

    return () => unsubscribe();
  }, []); // Removed dependencies to prevent overwriting user changes

  // Handler: Uploads a new profile image to Supabase and saves the public URL to Firestore
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 500 * 1024) {
      const user = auth.currentUser;
      if (user) {
        const fileName = `${user.uid}/${encodeURIComponent(file.name)}`;
        const { error } = await supabase.storage
          .from("flumers.ai")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.error("Error uploading image:", error);
          alert("Error uploading image: " + error.message);
          return;
        }

        const { data: publicUrlData, error: publicUrlError } = supabase.storage
          .from("flumers.ai")
          .getPublicUrl(fileName);

        if (publicUrlError) {
          console.error("Error fetching public URL:", publicUrlError);
          alert("Error fetching public URL: " + publicUrlError.message);
          return;
        }

        const imageUrl = publicUrlData.publicUrl;
        setImagePreview(imageUrl);

        // Save the image URL to Firestore
        const userDoc = doc(db, "users", user.uid);
        try {
          await setDoc(userDoc, { image: imageUrl }, { merge: true });
          console.log("Image URL saved to Firestore successfully.");
        } catch (firestoreError) {
          console.error("Error saving image URL to Firestore:", firestoreError);
          alert("Failed to save image URL. Please try again.");
        }

        // Add debugging log after setting imagePreview during image upload
        console.log("Setting imagePreview after upload:", imageUrl);
      }
    } else {
      alert("File size must be less than 500KB");
    }
  };

  // Handler: Updates profile state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  // Handler: Toggles a social media platform on/off
  const handlePlatformToggle = (platform) => {
    setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  // Handler: Updates platform data for a specific platform
  const handlePlatformDataChange = (platform, field, value) => {
    setPlatformData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  // Helper: Checks if the username is unique in Firestore
  const checkUsernameUnique = async (username) => {
    const userDoc = doc(db, "usernames", username);
    const userSnapshot = await getDoc(userDoc);
    return !userSnapshot.exists();
  };

  // Handler: Submits the profile form, validates fields, and saves to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imagePreview) {
      alert("Please upload an image before saving the profile.");
      return;
    }

    if (!allowedNiches.includes(profile.niche)) {
      alert("Please select a valid niche from the allowed options.");
      return;
    }

    if (isUsernameDisabled) {
      // Skip username uniqueness check if it's already set and disabled
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        try {
          await setDoc(userDoc, { ...profile, image: imagePreview, platforms: platformData }, { merge: true });
          localStorage.setItem(`profileData_${user.uid}`, JSON.stringify({ ...profile, image: imagePreview, platforms: platformData }));
          alert("Profile updated successfully");
        } catch (error) {
          console.error("Error saving profile:", error);
          alert("Failed to save profile. Please try again.");
        }
      }
      return;
    }

    const isUnique = await checkUsernameUnique(profile.username);
    if (!isUnique) {
      alert("Username already exists. Please choose a different username.");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const userDoc = doc(db, "users", user.uid);
      const usernameDoc = doc(db, "usernames", profile.username);
      try {
        console.log("Profile state before saving:", profile);
        console.log("Platform data before saving:", platformData);

        await setDoc(userDoc, { ...profile, image: imagePreview, platforms: platformData }, { merge: true });
        await setDoc(usernameDoc, { uid: user.uid });
        localStorage.setItem(`profileData_${user.uid}`, JSON.stringify({ ...profile, image: imagePreview, platforms: platformData }));
        alert("Profile updated successfully");
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
      }
    }
  };

  // --- UI Rendering ---
  // The UI includes:
  // 1. Main background and layout for the profile page
  // 2. Profile image upload and preview
  // 3. Form fields for all profile details (username, name, bio, niche, email)
  // 4. Platform selection and data entry
  // 5. Save button
  return (
    <Box
      // Main background and layout for the profile page
      sx={{
        backgroundImage: "url('/hero image.jpg')", // Hero background image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F0F2F5",
        minHeight: "calc(100vh - 64px)",
        width: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        top: 0,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        // Main heading for the profile page
        sx={{
          fontWeight: "bold",
          color: "#333",
          marginBottom: "20px",
        }}
      >
        Influencer Profile
      </Typography>
      <Paper
        elevation={3}
        // Card container for the profile form
        sx={{
          width: "80%",
          padding: "20px",
          borderRadius: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          // Box for profile image and upload button
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Avatar
            alt="Profile Image"
            src={imagePreview || "/dp.png"}
            // CSS: Large avatar with border for profile image
            sx={{
              width: 200,
              height: 200,
              marginBottom: "10px",
              border: "2px solid #333",
            }}
          />
          {!imagePreview && (
            <Button variant="contained" component="label">
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          )}
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} direction="column">
            {/* Each Grid contains a form field for profile details or platform data */}
            <Grid>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={profile.username || ""}
                onChange={handleChange}
                required
                disabled={isUsernameDisabled}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profile.name || ""}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={profile.bio || ""}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Niche"
                name="niche"
                select
                value={profile.niche || ""}
                onChange={handleChange}
                required
              >
                {/* Dropdown options for allowed niches */}
                {allowedNiches.map((niche) => (
                  <MenuItem key={niche} value={niche}>
                    {niche}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={profile.email || ""}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid>
              <Typography variant="h5" gutterBottom>
                Select Platforms
              </Typography>
              {/* Checkbox for each social media platform */}
              {Object.keys(platforms).map((platform) => (
                <FormControlLabel
                  key={platform}
                  control={
                    <Checkbox
                      checked={platforms[platform]}
                      onChange={() => handlePlatformToggle(platform)}
                    />
                  }
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                />
              ))}
            </Grid>
            {/* Platform data fields for each selected platform */}
            {Object.keys(platforms).map(
              (platform) =>
                platforms[platform] && (
                  <Grid key={platform}>
                    <Typography variant="h6" gutterBottom>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)} Data
                    </Typography>
                    <TextField
                      label="Followers"
                      value={platformData[platform]?.followers || ""}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "followers", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      label="Watch Time"
                      value={platformData[platform]?.watchTime || ""}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "watchTime", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      label="Social Media Link"
                      value={platformData[platform]?.link || ""}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "link", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                )
            )}
          </Grid>
          <Box sx={{ textAlign: "center", marginTop: "20px" }}>
            <Button type="submit" variant="contained" color="primary">
              Save Profile
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default InfluencerProfile;