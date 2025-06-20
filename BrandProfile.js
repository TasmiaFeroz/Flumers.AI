// BrandProfile.js
// This component allows a brand user to view and edit their profile information, including uploading a profile image, setting brand details, and selecting a niche.
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
} from "@mui/material";
import { db, auth } from "../../api/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { supabase } from "../../api/supabaseConfig"; // Import Supabase configuration
import { onAuthStateChanged } from "firebase/auth";

// --- Constants ---
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

// --- Component: BrandProfile ---
const BrandProfile = () => {
  // State: Stores all profile fields for the brand user
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    brandName: "",
    aboutBrand: "",
    niche: "",
    website: "", // Brand website field
    email: "",
  });
  // State: Stores the preview URL for the uploaded profile image
  const [imagePreview, setImagePreview] = useState("");
  // State: Controls whether the username field is disabled (after first set)
  const [isUsernameDisabled, setIsUsernameDisabled] = useState(false);

  // Effect: Fetches the brand profile from Firestore on auth state change, and persists to localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchProfile = async () => {
          const userDoc = doc(db, "users", user.uid);
          try {
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
              const profileData = userSnapshot.data();
              setProfile(profileData);
              setImagePreview(profileData.image || "");

              // Decode the image URL to handle double encoding issues
              const decodedImageUrl = decodeURIComponent(profileData.image || "");
              console.log("Decoded image URL after fetch:", decodedImageUrl);
              setImagePreview(decodedImageUrl);

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
          setProfile(JSON.parse(savedProfile));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handler: Uploads a new profile image to Supabase and saves the public URL to Firestore
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 500 * 1024) {
      const user = auth.currentUser;
      if (user) {
        const fileName = `${user.uid}/${encodeURIComponent(file.name)}`; // Encode file name to handle special characters
        const { error } = await supabase.storage
          .from("flumers.ai") // Updated bucket name
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
          .from("flumers.ai") // Updated bucket name
          .getPublicUrl(fileName);

        if (publicUrlError) {
          console.error("Error fetching public URL:", publicUrlError);
          alert("Error fetching public URL: " + publicUrlError.message);
          return;
        }

        console.log("Public URL:", publicUrlData.publicUrl); // Debugging log for public URL
        setImagePreview(publicUrlData.publicUrl);

        // Save the public URL to Firestore
        if (user) {
          const userDoc = doc(db, "users", user.uid);
          try {
            await setDoc(userDoc, { image: publicUrlData.publicUrl }, { merge: true });
            console.log("Image URL saved to Firestore:", publicUrlData.publicUrl);
          } catch (error) {
            console.error("Error saving image URL to Firestore:", error);
          }
        }
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
          await setDoc(userDoc, { ...profile, image: imagePreview }, { merge: true });
          localStorage.setItem(`profileData_${user.uid}`, JSON.stringify({ ...profile, image: imagePreview }));
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
        await setDoc(userDoc, { ...profile, image: imagePreview }, { merge: true });
        await setDoc(usernameDoc, { uid: user.uid });
        localStorage.setItem(`profileData_${user.uid}`, JSON.stringify({ ...profile, image: imagePreview }));
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
  // 3. Form fields for all profile details (username, name, brand name, niche, website)
  // 4. Save button
  return (
    <Box
      // Main background and layout for the profile page
      sx={{
        backgroundImage: "url('/hero image.jpg')", // Hero background image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F0F2F5",
        minHeight: "calc(100vh - 64px)", // Adjusted for navbar height
        width: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        top: 0, // Push content to start from the navbar
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
        Brand Profile
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
              width: 200, // Increased size
              height: 200, // Increased size
              marginBottom: "10px",
              border: "2px solid #333", // Outline
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
            {/* Each Grid contains a form field for profile details */}
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
                label="Brand Name"
                name="brandName"
                value={profile.brandName || ""}
                onChange={handleChange}
                required
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
                label="Brand Website"
                name="website"
                value={profile.website || ""}
                onChange={handleChange}
                required
              />
            </Grid>
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

export default BrandProfile;