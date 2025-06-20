import React, { useState } from "react";
import { Box, TextField, Button, Typography, MenuItem, Checkbox, FormControlLabel } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../api/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

// The UserInfo component is used to collect and save user information based on their role (influencer or brand).
// It dynamically renders fields and options based on the user's role and allows them to input platform-specific data.

// Utility function checkUsernameUnique:
// - Checks if the provided username is unique by querying the Firestore database.
// - Returns true if the username does not exist, ensuring uniqueness.
const checkUsernameUnique = async (username) => {
  // Creating a reference to the username document in Firestore
  const userDoc = doc(db, "usernames", username);
  // Fetching the document snapshot
  const userSnapshot = await getDoc(userDoc);
  // Returning true if the document does not exist
  return !userSnapshot.exists();
};

// UserInfo component:
// - Uses useLocation to access the user's role passed via navigation state.
// - Uses useNavigate to redirect users after form submission.
// - Manages form data and platform-specific data using useState.
const UserInfo = () => {
  // Accessing the location object to retrieve the user's role
  const location = useLocation();
  // Initializing the navigate function for redirection
  const navigate = useNavigate();
  // Extracting the role from location state
  const { role } = location.state || {};
  // State for general user information
  const [formData, setFormData] = useState({});
  // State for authenticated user
  const [user] = useAuthState(auth);
  // State for tracking selected social media platforms
  const [platforms, setPlatforms] = useState({
    youtube: false,
    instagram: false,
    tiktok: false,
    twitter: false,
    facebook: false,
  });
  // State for storing platform-specific data
  const [platformData, setPlatformData] = useState({
    youtube: { followers: "", watchTime: "", link: "" },
    instagram: { followers: "", watchTime: "", link: "" },
    tiktok: { followers: "", watchTime: "", link: "" },
    twitter: { followers: "", watchTime: "", link: "" },
    facebook: { followers: "", watchTime: "", link: "" },
  });

  // handleChange:
  // - Updates formData state when input fields change.
  const handleChange = (e) => {
    // Extracting the name and value from the event target
    const { name, value } = e.target;
    // Updating the formData state with the new value
    setFormData({ ...formData, [name]: value });
  };

  // handlePlatformToggle:
  // - Toggles the selection state of a social media platform.
  const handlePlatformToggle = (platform) => {
    // Updating the platforms state by toggling the selected platform
    setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  // handlePlatformDataChange:
  // - Updates platform-specific data, formatting followers using formatNumber.
  const handlePlatformDataChange = (platform, field, value) => {
    // Updating the platformData state with the new value
    setPlatformData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  // handleSubmit:
  // - Validates the username for uniqueness.
  // - Saves user information and platform data to Firestore.
  // - Handles errors gracefully and provides user feedback.
  const handleSubmit = async (e) => {
    // Preventing the default form submission behavior
    e.preventDefault();

    // Checking if the role is influencer or brand
    if (role === "influencer" || role === "brand") {
      // Validating the username for uniqueness
      const isUnique = await checkUsernameUnique(formData.username);
      if (!isUnique) {
        // Alerting the user if the username is not unique
        alert("Username already exists. Please choose a different username.");
        return;
      }
    }

    try {
      // Throwing an error if the user is not authenticated
      if (!user) {
        throw new Error("User is not authenticated");
      }
      // Creating references to user and username documents in Firestore
      const userDoc = doc(db, "users", user.uid);
      const usernameDoc = doc(db, "usernames", formData.username);
      // Saving user information and platform data to Firestore
      await setDoc(userDoc, { ...formData, platforms: platformData }, { merge: true });
      await setDoc(usernameDoc, { uid: user.uid });
      // Alerting the user that their information has been saved
      alert("Your information has been saved.");
      // Redirecting the user to the login page
      navigate("/login");
    } catch (error) {
      // Logging the error and alerting the user
      console.error("Error saving data:", error);
      alert("Failed to save your information. Please try again.");
    }
  };

  // JSX structure:
  // - Box: Acts as the main container for the form, providing layout and styling.
  // - Typography: Displays headings or titles, such as "Influencer Information" or "Brand Information".
  // - TextField: Collects user input for fields like name, username, age, etc.
  // - MenuItem: Provides dropdown options for selecting a niche.
  // - FormControlLabel: Wraps checkboxes for selecting social media platforms.
  // - Button: Submits the form data to save user information.
  return (
    <Box
      // Main container for the form, styled for alignment and aesthetics.
      sx={{
        textAlign: "center", // Aligns content to the center.
        marginTop: "50px", // Adds spacing above the container.
        padding: "20px", // Adds internal spacing within the container.
        backgroundColor: "#ffffff", // Sets the background color to white.
        borderRadius: "8px", // Rounds the corners of the container.
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow for depth.
        maxWidth: "600px", // Limits the width of the container.
        margin: "50px auto", // Centers the container horizontally.
      }}
    >
      <Typography
        // Displays the title of the form based on the user's role.
        variant="h4" // Sets the text size and style.
        gutterBottom // Adds spacing below the text.
        sx={{ color: "#050505" }} // Sets the text color.
      >
        {role === "influencer" ? "Influencer Information" : "Brand Information"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          // Input field for the user's name.
          label="Name"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          // Input field for the user's username.
          label="Username"
          name="username"
          value={formData.username || ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          // Input field for the user's age.
          label="Age"
          name="age"
          type="number"
          value={formData.age || ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        {role === "influencer" && (
          // Conditional rendering for influencer-specific fields.
          <>
            <TextField
              // Dropdown for selecting the user's niche.
              select
              label="Niche"
              name="niche"
              value={formData.niche || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              <MenuItem value="baby_products">Baby Products</MenuItem>
              <MenuItem value="beauty_health">Beauty & Health</MenuItem>
              <MenuItem value="clothing_accessories_jewellery">Clothing, Accessories & Jewellery</MenuItem>
              <MenuItem value="electronics">Electronics</MenuItem>
              <MenuItem value="grocery">Grocery</MenuItem>
              <MenuItem value="hobby_arts_stationery">Hobby, Arts & Stationery</MenuItem>
              <MenuItem value="home_kitchen_tools">Home, Kitchen & Tools</MenuItem>
              <MenuItem value="pet_supplies">Pet Supplies</MenuItem>
              <MenuItem value="sports_outdoor">Sports & Outdoor</MenuItem>
            </TextField>
            <Typography
              // Section title for selecting social media platforms.
              variant="h5"
              gutterBottom
              sx={{ color: "#050505", marginTop: "20px" }}
            >
              Select Platforms
            </Typography>
            {Object.keys(platforms).map((platform) => (
              <FormControlLabel
                // Checkbox for selecting a social media platform.
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

            {Object.keys(platforms).map(
              (platform) =>
                platforms[platform] && (
                  <Box
                    // Container for platform-specific data input fields.
                    key={platform}
                    sx={{ marginTop: "20px" }}
                  >
                    <Typography
                      // Section title for platform-specific data.
                      variant="h6"
                      gutterBottom
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)} Data
                    </Typography>
                    <TextField
                      // Input field for the number of followers.
                      label="Followers"
                      value={platformData[platform].followers}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "followers", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      // Input field for watch time.
                      label="Watch Time"
                      value={platformData[platform].watchTime}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "watchTime", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                    />
                    <TextField
                      // Input field for the social media link.
                      label="Social Media Link"
                      value={platformData[platform].link}
                      onChange={(e) =>
                        handlePlatformDataChange(platform, "link", e.target.value)
                      }
                      fullWidth
                      margin="normal"
                      required
                    />
                  </Box>
                )
            )}
          </>
        )}
        {role === "brand" && (
          // Conditional rendering for brand-specific fields.
          <>
            <TextField
              // Input field for the brand's website.
              label="Website"
              name="website"
              type="url"
              value={formData.website || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              // Input field for the brand's product.
              label="Product"
              name="product"
              value={formData.product || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              // Dropdown for selecting the brand's niche.
              select
              label="Niche"
              name="niche"
              value={formData.niche || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              <MenuItem value="baby_products">Baby Products</MenuItem>
              <MenuItem value="beauty_health">Beauty & Health</MenuItem>
              <MenuItem value="clothing_accessories_jewellery">Clothing, Accessories & Jewellery</MenuItem>
              <MenuItem value="electronics">Electronics</MenuItem>
              <MenuItem value="grocery">Grocery</MenuItem>
              <MenuItem value="hobby_arts_stationery">Hobby, Arts & Stationery</MenuItem>
              <MenuItem value="home_kitchen_tools">Home, Kitchen & Tools</MenuItem>
              <MenuItem value="pet_supplies">Pet Supplies</MenuItem>
              <MenuItem value="sports_outdoor">Sports & Outdoor</MenuItem>
            </TextField>
          </>
        )}
        <Button
          // Button for submitting the form.
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ marginTop: 2, padding: "10px 20px" }}
        >
          Submit
        </Button>
      </form>
    </Box>
  );
};

export default UserInfo;