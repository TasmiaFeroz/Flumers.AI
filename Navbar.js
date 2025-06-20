import React, { useState } from "react";
import { AppBar, Toolbar, Button, Box, useMediaQuery, Drawer, IconButton, List, ListItem, ListItemText, Divider, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../api/firebaseConfig";
import logo from '../logo.png';
import { Close as CloseIcon, Person as PersonIcon, ShoppingCart as ShoppingCartIcon, Chat as ChatIcon, Search as SearchIcon, ExitToApp as ExitToAppIcon, Login as LoginIcon, AppRegistration as AppRegistrationIcon } from "@mui/icons-material";

// The Navbar component provides navigation options for users based on their role and authentication status.
// It dynamically adjusts its layout and options for mobile and desktop views.

// Importing React and Material-UI components for UI design.
// Importing React Router hooks for navigation and location handling.
// Importing Firebase authentication for user state management.

const Navbar = () => {
  // useNavigate: Enables navigation to other pages.
  const navigate = useNavigate();
  // useLocation: Retrieves the current route to determine the user's context.
  const location = useLocation();
  // useAuthState: Manages the authentication state of the user.
  const [user] = useAuthState(auth);
  // useMediaQuery: Detects if the screen size is mobile.
  const isMobile = useMediaQuery("(max-width:600px)");
  // State for managing the mobile drawer.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Determines if the current page is an authentication page.
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  // Determines if the user is on a brand-related page.
  const isBrand = location.pathname.includes("brand");
  // Determines if the user is on an influencer-related page.
  const isInfluencer = location.pathname.includes("influencer");

  const handleLogout = () => {
    // Logs out the user and navigates to the home page.
    auth.signOut();
    navigate("/");
  };

  const toggleDrawer = (open) => (event) => {
    // Toggles the mobile drawer open or closed.
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppBar
      // Main container for the navigation bar.
      position="static"
      sx={{
        background: "linear-gradient(135deg, #FF6EC7, #4A90E2)", // Sets a gradient background.
        boxShadow: "none", // Removes the default shadow.
        height: isMobile ? 60 : 80, // Adjusts height based on screen size.
      }}
    >
      <Toolbar
        // Container for navigation options.
        sx={{
          flexDirection: "row", // Aligns items in a row.
          alignItems: "center", // Centers items vertically.
          justifyContent: "space-between", // Distributes items evenly.
        }}
      >
        <Box
          // Logo container.
          component="img"
          src={logo} // Displays the Flumers.AI logo.
          alt="Flumers.AI Logo"
          sx={{
            height: isMobile ? 40 : 60, // Adjusts logo size based on screen size.
            cursor: "pointer", // Changes cursor to pointer on hover.
          }}
          onClick={() => navigate("/")} // Navigates to the home page on click.
        />
        {isMobile ? (
          // Mobile view: Displays a drawer for navigation options.
          <>
            <IconButton
              // Button to open the mobile drawer.
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              // Drawer container for mobile navigation.
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              sx={{
                "& .MuiDrawer-paper": {
                  backgroundColor: "#ffffff", // Sets the background color to white.
                  color: "#333", // Sets the text color.
                  padding: "16px", // Adds internal spacing.
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow.
                },
              }}
            >
              <Box
                // Container for drawer content.
                sx={{
                  width: 300, // Sets the width of the drawer.
                  display: "flex", // Aligns items in a column.
                  flexDirection: "column",
                  alignItems: "center", // Centers items horizontally.
                }}
                role="presentation"
                onKeyDown={toggleDrawer(false)}
              >
                <Box
                  // Header section of the drawer.
                  sx={{
                    display: "flex", // Aligns items in a row.
                    justifyContent: "space-between", // Distributes items evenly.
                    alignItems: "center", // Centers items vertically.
                    width: "100%", // Sets the width to full.
                    marginBottom: "16px", // Adds spacing below the header.
                  }}
                >
                  <Typography
                    // Title of the drawer.
                    variant="h6"
                    sx={{
                      fontWeight: "bold", // Sets the font weight to bold.
                      color: "#4A90E2", // Sets the text color.
                    }}
                  >
                    Menu
                  </Typography>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ width: "100%", marginBottom: "16px" }} />
                <List sx={{ width: "100%" }}>
                  {user && isInfluencer && (
                    // Influencer-specific navigation options.
                    <>
                      <ListItem button="true" onClick={() => navigate("/influencer-profile")}>
                        <PersonIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Profile" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/influencer-orders")}>
                        <ShoppingCartIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Orders" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/influencer-chats")}>
                        <ChatIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Chats" />
                      </ListItem>
                    </>
                  )}
                  {user && isBrand && (
                    // Brand-specific navigation options.
                    <>
                      <ListItem button="true" onClick={() => navigate("/brand-profile")}>
                        <PersonIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Profile" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/search-influencers")}>
                        <SearchIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Search Influencers" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/brand-chats")}>
                        <ChatIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Chats" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/brand-orders")}>
                        <ShoppingCartIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Orders" />
                      </ListItem>
                    </>
                  )}
                  {user && (
                    // Logout option for authenticated users.
                    <ListItem button="true" onClick={handleLogout}>
                      <ExitToAppIcon sx={{ marginRight: "8px" }} />
                      <ListItemText primary="Logout" />
                    </ListItem>
                  )}
                  {!user && !isAuthPage && (
                    // Login and Signup options for unauthenticated users.
                    <>
                      <ListItem button="true" onClick={() => navigate("/login")}>
                        <LoginIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Login" />
                      </ListItem>
                      <ListItem button="true" onClick={() => navigate("/signup")}>
                        <AppRegistrationIcon sx={{ marginRight: "8px" }} />
                        <ListItemText primary="Signup" />
                      </ListItem>
                    </>
                  )}
                </List>
                <Divider sx={{ width: "100%", marginTop: "16px" }} />
                <Typography
                  // Footer text in the drawer.
                  variant="body2"
                  sx={{
                    marginTop: "16px", // Adds spacing above the footer.
                    color: "#777", // Sets the text color.
                    textAlign: "center", // Centers the text.
                  }}
                >
                  © 2025 Flumers.AI
                </Typography>
              </Box>
            </Drawer>
          </>
        ) : (
          // Desktop view: Displays navigation options directly.
          <Box
            sx={{
              display: "flex", // Aligns items in a row.
              flexDirection: "row",
              gap: 2, // Adds spacing between items.
            }}
          >
            {user && isInfluencer && (
              // Influencer-specific navigation options.
              <>
                <Button color="inherit" onClick={() => navigate("/influencer-profile")}>Profile</Button>
                <Button color="inherit" onClick={() => navigate("/influencer-orders")}>Orders</Button>
                <Button color="inherit" onClick={() => navigate("/influencer-chats")}>Chats</Button>
              </>
            )}
            {user && isBrand && (
              // Brand-specific navigation options.
              <>
                <Button color="inherit" onClick={() => navigate("/brand-profile")}>Profile</Button>
                <Button color="inherit" onClick={() => navigate("/search-influencers")}>Search Influencers</Button>
                <Button color="inherit" onClick={() => navigate("/brand-chats")}>Chats</Button>
                <Button color="inherit" onClick={() => navigate("/brand-orders")}>Orders</Button>
              </>
            )}
            {user && (
              // Logout option for authenticated users.
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            )}
            {!user && !isAuthPage && (
              // Login and Signup options for unauthenticated users.
              <>
                <Button color="inherit" onClick={() => navigate("/login")}>Login</Button>
                <Button color="inherit" onClick={() => navigate("/signup")}>Signup</Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;