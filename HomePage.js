import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Paper, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../api/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "../App.css";

// The HomePage component serves as the landing page for both authenticated and unauthenticated users.
// It dynamically renders content based on the user's authentication status and role.
// For authenticated users, it fetches user data from Firestore and navigates them to their respective dashboards.
// For unauthenticated users, it displays a welcome message and options to log in or sign up.

// The HomePage.js file defines the HomePage component.
// It serves as the landing page for authenticated and unauthenticated users.
// The component dynamically renders content based on the user's authentication status and role.

const HomePage = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [user] = useAuthState(auth); // Hook to get the current authenticated user
  const [userData, setUserData] = useState(null); // State to store user data fetched from Firestore
  const [loading, setLoading] = useState(true); // State to manage the loading state

  useEffect(() => {
    // useEffect hook to fetch user data when the component mounts or the user changes
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = doc(db, "users", user.uid); // Reference to the user's document in Firestore
          const userSnapshot = await getDoc(userDoc); // Fetch the document snapshot
          if (userSnapshot.exists()) {
            const data = userSnapshot.data(); // Extract data from the snapshot
            setUserData(data); // Update the userData state with the fetched data
            if (data.role === "brand") {
              navigate("/brand-dashboard"); // Navigate to the brand dashboard if the role is "brand"
            } else if (data.role === "influencer") {
              navigate("/influencer-dashboard"); // Navigate to the influencer dashboard if the role is "influencer"
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error); // Log any errors during data fetching
        }
      }
      setLoading(false); // Set loading state to false after fetching data
    };

    fetchUserData(); // Call the fetchUserData function
  }, [user, navigate]); // Dependencies for the useEffect hook

  if (loading) {
    // Render a loading spinner while data is being fetched
    return (
      <Box
        // The Box component serves as a container for the loading spinner.
        // CSS properties:
        // - display: "flex" aligns child elements in a flexible layout.
        // - justifyContent: "center" centers child elements horizontally.
        // - alignItems: "center" centers child elements vertically.
        // - height: "100vh" sets the height to fill the viewport.
        // - backgroundColor: "#F0F2F5" sets a light gray background color.
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#F0F2F5",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    if (userData) {
      if (!userData.role) {
        // Render a message if the user's role cannot be determined
        return (
          <Box
            // CSS properties:
            // - display: "flex" aligns child elements in a flexible layout.
            // - justifyContent: "center" centers child elements horizontally.
            // - alignItems: "center" centers child elements vertically.
            // - height: "100vh" sets the height to fill the viewport.
            // - backgroundColor: "#F0F2F5" sets a light gray background color.
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
              backgroundColor: "#F0F2F5",
            }}
          >
            <Typography variant="h6" sx={{ color: "#65676B" }}>
              Unable to determine your role. Please contact support.
            </Typography>
          </Box>
        );
      }
      // Render a welcome message and dashboard navigation button for authenticated users
      return (
        <Box
          // CSS properties:
          // - backgroundColor: "#F0F2F5" sets a light gray background color.
          // - height: "100vh" sets the height to fill the viewport.
          // - display: "flex" aligns child elements in a flexible layout.
          // - flexDirection: "column" arranges child elements vertically.
          // - justifyContent: "center" centers child elements horizontally.
          // - alignItems: "center" centers child elements vertically.
          // - textAlign: "center" centers text content.
          // - padding: "20px" adds padding around the content. 
          sx={{
            backgroundColor: "#F0F2F5",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <Paper
            // CSS properties:
            // - elevation: "3" adds a shadow effect.
            // - padding: "30px" adds padding inside the paper.
            // - borderRadius: "12px" rounds the corners.
            // - maxWidth: "500px" sets the maximum width.
            // - textAlign: "center" centers text content.
            sx={{
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              textAlign: "center",
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: "#050505" }}>
              Welcome Back, {userData.name}!
            </Typography>
            <Typography variant="body1" sx={{ color: "#65676B", marginBottom: "10px" }}>
              <strong>Role:</strong> {userData.role}
            </Typography>
            <Typography variant="body1" sx={{ color: "#65676B", marginBottom: "20px" }}>
              <strong>Email:</strong> {user.email}
            </Typography>
            <Button
              // CSS properties:
              // - variant: "contained" applies a filled button style.
              // - color: "primary" sets the button color.
              // - size: "large" increases the button size.
              // - padding: "10px 20px" adds padding inside the button.
              sx={{ padding: "10px 20px" }}
              onClick={() => {
                if (userData.role === "brand") {
                  navigate("/brand-dashboard");
                } else if (userData.role === "influencer") {
                  navigate("/influencer-dashboard");
                }
              }}
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
      );
    }
    // Render a message while user data is being loaded
    return (
      <Box
        // CSS properties:
        // - display: "flex" aligns child elements in a flexible layout.
        // - justifyContent: "center" centers child elements horizontally.
        // - alignItems: "center" centers child elements vertically.
        // - height: "100vh" sets the height to fill the viewport.
        // - backgroundColor: "#F0F2F5" sets a light gray background color.
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#F0F2F5",
        }}
      >
        <Typography variant="h6" sx={{ color: "#65676B" }}>
          Loading your data...
        </Typography>
      </Box>
    );
  }

  // Render the homepage for unauthenticated users
  return (
    <Box
      // This Box component serves as the main container for the homepage.
      // It provides a visually appealing background and centers the content.
      sx={{
        backgroundImage: "url('IMG-20250528-WA0068.jpg')", // Sets the background image for the homepage.
        backgroundSize: "cover", // Ensures the image covers the entire container.
        backgroundPosition: "center", // Centers the background image.
        backgroundRepeat: "no-repeat", // Prevents the image from repeating.
        backgroundColor: "#F0F2F5", // Adds a fallback background color.
        height: "100vh", // Makes the container fill the viewport height.
        display: "flex", // Enables flexbox layout for child elements.
        flexDirection: "column", // Arranges child elements vertically.
        justifyContent: "center", // Centers child elements horizontally.
        alignItems: "center", // Centers child elements vertically.
        textAlign: "center", // Aligns text content to the center.
        padding: "20px", // Adds padding around the content.
      }}
    >
      <Paper
        // This Paper component provides a card-like design for the homepage content.
        // It includes styling for padding, rounded corners, and shadow effects.
        elevation={4} // Adds a shadow effect to the card.
        sx={{
          padding: "30px", // Adds space inside the card.
          borderRadius: "12px", // Rounds the corners of the card.
          maxWidth: "600px", // Sets the maximum width of the card.
          textAlign: "center", // Centers the text inside the card.
          backgroundColor: "rgba(255, 255, 255, 0.8)", // Sets a semi-transparent white background.
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", // Adds a shadow effect to the card.
        }}
      >
        <Typography
          // This Typography component displays the main heading of the homepage.
          // It includes styling for font size, color, and spacing.
          variant="h4" // Sets the heading style.
          gutterBottom // Adds spacing below the heading.
          sx={{
            color: "#333", // Sets the text color to dark gray.
            fontWeight: "bold", // Makes the text bold.
            marginBottom: "20px", // Adds space below the heading.
          }}
        >
          Welcome to Flumers.AI
        </Typography>
        <Typography
          // This Typography component displays a brief description of the platform.
          // It includes styling for font size, color, and spacing.
          variant="body1" // Sets the body text style.
          sx={{
            color: "#555", // Sets the text color to medium gray.
            marginBottom: "20px", // Adds space below the text.
          }}
        >
          The next-generation AI-powered influencer marketing platform.
        </Typography>
        <Box>
          <Button
            // This Button component navigates the user to the login page.
            // It includes styling for color, padding, and spacing.
            variant="contained" // Applies a filled button style.
            color="primary" // Sets the button color to primary.
            sx={{
              margin: "0 10px", // Adds horizontal spacing between buttons.
              padding: "10px 20px", // Adds space inside the button.
              fontWeight: "bold", // Makes the button text bold.
            }}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            // This Button component navigates the user to the signup page.
            // It includes styling for color, padding, and spacing.
            variant="outlined" // Applies a bordered button style.
            color="secondary" // Sets the button color to secondary.
            sx={{
              margin: "0 10px", // Adds horizontal spacing between buttons.
              padding: "10px 20px", // Adds space inside the button.
              fontWeight: "bold", // Makes the button text bold.
            }}
            onClick={() => navigate("/signup")}
          >
            Signup
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default HomePage;