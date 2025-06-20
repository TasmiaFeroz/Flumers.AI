import React, { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "../api/auth";
import { TextField, Button, Typography, Snackbar, Alert, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../api/firebaseConfig";

// The Login.js file defines the Login component for user authentication.
// It provides a form for users to log in using email/password or Google authentication.
// Additionally, it includes frontend design elements for a responsive and visually appealing interface.

const Login = () => {
  // State variables for managing form inputs and error messages
  const [email, setEmail] = useState(""); // Stores the user's email
  const [password, setPassword] = useState(""); // Stores the user's password
  const [error, setError] = useState(""); // Stores error messages
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Controls the visibility of the snackbar
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    try {
      const user = await loginWithEmail(email, password); // Call the loginWithEmail function to authenticate the user
      if (!user || !user.uid) {
        throw new Error("Invalid user object returned from login."); // Throw an error if the user object is invalid
      }
      localStorage.setItem("uid", user.uid); // Store the user's UID in localStorage
      const role = await getUserRole(user.uid); // Fetch the user's role from the database
      if (!role) {
        throw new Error("User role not found. Please contact support."); // Throw an error if the role is not found
      }
      localStorage.setItem("role", role); // Store the user's role in localStorage
      if (role === "brand") {
        navigate("/brand-dashboard"); // Navigate to the brand dashboard if the role is "brand"
      } else if (role === "influencer") {
        navigate("/influencer-dashboard"); // Navigate to the influencer dashboard if the role is "influencer"
      } else {
        throw new Error("Unknown role. Please contact support."); // Throw an error for unknown roles
      }
    } catch (error) {
      console.error("Login error:", error); // Log the error to the console
      alert(error.message || "Login failed. Please try again."); // Show an alert with the error message
    }
  };

  // Function to handle Google login
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle(); // Call the loginWithGoogle function to authenticate the user via Google
      if (!user || !user.uid) {
        throw new Error("Invalid user object returned from Google login."); // Throw an error if the user object is invalid
      }
      localStorage.setItem("uid", user.uid); // Store the user's UID in localStorage
      const role = await getUserRole(user.uid); // Fetch the user's role from the database
      if (!role) {
        throw new Error("User role not found. Please contact support."); // Throw an error if the role is not found
      }
      localStorage.setItem("role", role); // Store the user's role in localStorage
      if (role === "brand") {
        navigate("/brand-dashboard"); // Navigate to the brand dashboard if the role is "brand"
      } else if (role === "influencer") {
        navigate("/influencer-dashboard"); // Navigate to the influencer dashboard if the role is "influencer"
      } else {
        throw new Error("Unknown role. Please contact support."); // Throw an error for unknown roles
      }
    } catch (err) {
      console.error("Google login error:", err); // Log the error to the console
      setError(err.message || "Google login failed. Please try again."); // Set the error message in state
      setSnackbarOpen(true); // Open the snackbar to display the error message
    }
  };

  // Function to close the snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false); // Hide the snackbar
  };

  return (
    <Box
      // The Box component serves as a container for the login page.
      // It includes styling for background image, layout, and alignment.
      sx={{
        backgroundImage: "url('/hero image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
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
        // The Paper component provides a card-like design for the login form.
        // It includes styling for padding, border radius, and shadow effects.
        elevation={4}
        sx={{
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "400px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Typography
          // The Typography component displays the login heading.
          // It includes styling for font size, color, and margin.
          variant="h4"
          gutterBottom
          sx={{
            color: "#333",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            // The TextField component provides an input field for the user's email.
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ marginBottom: "20px" }}
          />
          <TextField
            // The TextField component provides an input field for the user's password.
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ marginBottom: "20px" }}
          />
          <Button
            // The Button component submits the login form.
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Login
          </Button>
        </form>
        <Button
          // The Button component triggers Google login.
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ marginTop: "20px" }}
          onClick={handleGoogleLogin}
        >
          Login with Google
        </Button>
        <Typography
          // The Typography component displays a link to the signup page.
          variant="body2"
          sx={{ marginTop: "20px" }}
        >
          Don't have an account? <Button color="primary" onClick={() => navigate('/signup')}>Sign up</Button>
        </Typography>
      </Paper>
      <Snackbar
        // The Snackbar component displays error messages.
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          // The Alert component shows the error message inside the snackbar.
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;