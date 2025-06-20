import React, { useState } from "react";
import { signupWithEmail, loginWithGoogle } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button } from "@mui/material";

// The Signup.js file defines the Signup component for user registration.
// It provides a form for users to sign up using email/password or Google authentication.
// Additionally, it includes frontend design elements for a responsive and visually appealing interface.

const Signup = () => {
  // State variables for managing form inputs
  const [email, setEmail] = useState(""); // Stores the user's email
  const [password, setPassword] = useState(""); // Stores the user's password
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle email/password signup
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    try {
      const user = await signupWithEmail(email, password); // Call the signupWithEmail function
      navigate("/select-role", { state: { uid: user.uid } }); // Navigate to the select-role page
    } catch (error) {
      console.error("Signup error:", error); // Log the error to the console
      alert("Signup failed. Please try again."); // Show an alert to the user
    }
  };

  // Function to handle Google signup
  const handleGoogleSignup = async () => {
    try {
      const user = await loginWithGoogle(); // Call the loginWithGoogle function
      navigate("/select-role", { state: { uid: user.uid } }); // Navigate to the select-role page
    } catch (error) {
      console.error("Google signup error:", error); // Log the error to the console
      alert("Google signup failed. Please try again."); // Show an alert to the user
    }
  };

  return (
    <Box
      // The Box component serves as a container for the signup page.
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
        // The Paper component provides a card-like design for the signup form.
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
          // The Typography component displays the signup heading.
          // It includes styling for font size, color, and margin.
          variant="h4"
          gutterBottom
          sx={{
            color: "#333",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Signup
        </Typography>
        <form onSubmit={handleSignup}>
          <TextField
            // The TextField component provides an input field for the user's email.
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{ marginBottom: "20px" }}
          />
          <TextField
            // The TextField component provides an input field for the user's password.
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={{ marginBottom: "20px" }}
          />
          <Button
            // The Button component submits the signup form.
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            Sign Up
          </Button>
        </form>
        <Button
          // The Button component triggers Google signup.
          onClick={handleGoogleSignup}
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ marginTop: "20px" }}
        >
          Sign Up with Google
        </Button>
      </Paper>
    </Box>
  );
};

export default Signup;