import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { setUserRole } from "../api/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../api/firebaseConfig";

// The SelectRole component allows users to choose their role (Influencer or Brand).
// It updates the user's role in Firestore and navigates them to the UserInfo page.

// Importing React and Material-UI components for UI design.
// Importing React Router hooks for navigation and location handling.
// Importing Firestore methods for database operations.

const SelectRole = () => {
  // useLocation: Retrieves the user's unique ID passed via navigation state.
  const location = useLocation();
  // useNavigate: Enables navigation to other pages.
  const navigate = useNavigate();
  // Extracting the user's unique ID from location state.
  const { uid } = location.state || {};

  const handleRoleSelection = async (role) => {
    // Updates the user's role in Firestore and navigates to the UserInfo page.
    try {
      await setUserRole(uid, role); // Custom function to set the user's role.
      navigate("/user-info", { state: { role } }); // Navigates to the UserInfo page.
    } catch (error) {
      console.error("Error setting role:", error);
      alert("Failed to set role. Please try again.");
    }

    // Saves the user's role in Firestore under the "users" collection.
    try {
      const user = auth.currentUser; // Retrieves the currently logged-in user.
      if (user) {
        const userDoc = doc(db, "users", user.uid); // Reference to the user's document.
        await setDoc(userDoc, { role }, { merge: true }); // Merges the role into the existing document.
        console.log(`Role ${role} has been saved to Firestore.`);
      } else {
        console.error("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error saving role to Firestore:", error);
    }
  };

  return (
    <Box
      // Main container for the role selection UI.
      sx={{
        textAlign: "center", // Aligns content to the center.
        marginTop: "50px", // Adds spacing above the container.
        padding: "20px", // Adds internal spacing within the container.
        backgroundColor: "#ffffff", // Sets the background color to white.
        borderRadius: "8px", // Rounds the corners of the container.
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow for depth.
        maxWidth: "500px", // Limits the width of the container.
        margin: "50px auto", // Centers the container horizontally.
      }}
    >
      <Typography
        // Displays the title of the role selection page.
        variant="h4" // Sets the text size and style.
        gutterBottom // Adds spacing below the text.
        sx={{ color: "#050505" }} // Sets the text color.
      >
        Select Your Role
      </Typography>
      <Button
        // Button for selecting the "Influencer" role.
        variant="contained" // Sets the button style to contained.
        color="primary" // Sets the button color to primary.
        size="large" // Sets the button size to large.
        sx={{ margin: 2, padding: "10px 20px" }} // Adds margin and padding.
        onClick={() => handleRoleSelection("influencer")} // Calls handleRoleSelection with "influencer".
      >
        Influencer
      </Button>
      <Button
        // Button for selecting the "Brand" role.
        variant="outlined" // Sets the button style to outlined.
        color="secondary" // Sets the button color to secondary.
        size="large" // Sets the button size to large.
        sx={{ margin: 2, padding: "10px 20px" }} // Adds margin and padding.
        onClick={() => handleRoleSelection("brand")} // Calls handleRoleSelection with "brand".
      >
        Brand
      </Button>
    </Box>
  );
};

export default SelectRole;