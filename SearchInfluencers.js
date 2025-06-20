// SearchInfluencers.js
// This component allows brands to search, filter, and view influencer profiles.
// Features include: filtering by followers, platform, niche, and name; AI-powered influencer search; and requesting an AI influencer.
// All state, effects, functions, and UI/CSS blocks are commented for clarity and maintainability.

import React, { useState, useEffect } from "react";
import { Container, Typography, TextField, Button, MenuItem, Box, Card, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { db } from "../../api/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";

// Utility function to format numbers (e.g., followers count) into human-readable strings
const formatNumber = (num) => {
  if (!num || isNaN(num)) return num;
  const number = parseInt(num, 10);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toString();
};

// Utility function to decode and format image URLs
const formatImageUrl = (url) => {
  return decodeURIComponent(url || "/dp.png"); // Decode URL and use placeholder if invalid
};

const SearchInfluencers = () => {
  // State: List of all influencers fetched from Firestore
  const [influencers, setInfluencers] = useState([]);
  // State: Filter values for followers, platform, niche, and search text
  const [filters, setFilters] = useState({
    followers: "",
    platform: "",
    niche: "",
    search: "",
  });
  // State: Controls the visibility of the AI image upload popup
  const [openPopup, setOpenPopup] = useState(false);
  // State: Selected platform for AI search
  const [selectedPlatform, setSelectedPlatform] = useState("");
  // State: Form data for AI influencer request (no longer used)
  // const [aiRequestForm, setAiRequestForm] = useState({
  //   modelType: "",
  //   description: "",
  //   contactInfo: "",
  // });
  // State: Stores the uploaded brand image for AI search
  const [brandImage, setBrandImage] = useState(null);

  // Handler to open the AI image upload popup
  const handleOpenPopup = () => setOpenPopup(true);
  // Handler to close the AI image upload popup
  const handleClosePopup = () => setOpenPopup(false);

  // Handler for changes in the AI request form fields
  // const handleAiRequestChange = (e) => { ... };
  // Handler to submit the AI influencer request form
  // const handleAiRequestSubmit = () => { ... };
  // Handler to close the AI influencer request popup
  // const handleAiRequestClose = () => { ... };

  // Handler to proceed with searching influencers after uploading an image
  const handleProceedSearching = async () => {
    if (!brandImage) {
      alert("Please upload an image before proceeding.");
      return;
    }

    const formData = new FormData();
    formData.append("image", brandImage);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/classify/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to classify the image. Please try again.");
      }

      const data = await response.json();
      const { category } = data;

      setFilters({ ...filters, niche: category });
      handleClosePopup();
    } catch (error) {
      console.error("Error during image classification:", error);
      alert("An error occurred while processing the image. Please try again.");
    }
  };

  // Effect: Fetch influencers from Firestore on component mount
  useEffect(() => {
    const fetchInfluencers = async () => {
      const influencersRef = collection(db, "users");
      const q = query(influencersRef, where("role", "==", "influencer"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const influencer = { id: doc.id, ...doc.data() };

        // Determine the platform with the highest follower count for each influencer
        if (influencer.platforms) {
          const highestPlatform = Object.entries(influencer.platforms).reduce(
            (max, [platform, details]) => {
              const followers = parseInt(details.followers || 0, 10);
              return followers > max.followers ? { platform, followers } : max;
            },
            { platform: "Not available", followers: 0 }
          );

          influencer.platform = highestPlatform.platform;
          influencer.followers = formatNumber(highestPlatform.followers);
        } else {
          influencer.platform = "Not available";
          influencer.followers = "Not available";
        }

        return influencer;
      });
      setInfluencers(data);
    };

    fetchInfluencers();
  }, []);

  // Handler for changes in the filter fields
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Filter influencers based on the selected filter criteria
  const filteredInfluencers = influencers.filter((influencer) => {
    return (
      (!filters.followers || influencer.followers >= filters.followers) &&
      (!filters.platform || influencer.platform === filters.platform) &&
      (!filters.niche || influencer.niche === filters.niche) &&
      (!filters.search || (influencer.name && influencer.name.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  return (
    <Box
      sx={{
        backgroundImage: "url('/hero image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F0F2F5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <TextField
          label="Search by Name"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          sx={{ marginRight: "10px", flex: 1 }}
        />
        <TextField
          label="Followers"
          name="followers"
          type="number"
          value={filters.followers}
          onChange={handleFilterChange}
          sx={{ marginRight: "10px", flex: 1 }}
        />
        <TextField
          label="Platform"
          name="platform"
          select
          value={filters.platform}
          onChange={handleFilterChange}
          sx={{ marginRight: "10px", flex: 1 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="youtube">YouTube</MenuItem>
          <MenuItem value="instagram">Instagram</MenuItem>
          <MenuItem value="tiktok">TikTok</MenuItem>
          <MenuItem value="twitter">Twitter</MenuItem>
          <MenuItem value="facebook">Facebook</MenuItem>
        </TextField>
        <TextField
          label="Niche"
          name="niche"
          select
          value={filters.niche}
          onChange={handleFilterChange}
          sx={{ flex: 1 }}
        >
          <MenuItem value="">all</MenuItem>
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
      </Box>

      <Button
        variant="contained"
        color="secondary"
        sx={{ margin: "20px auto", display: "block" }}
        onClick={handleOpenPopup}
      >
        Find the Best Influencer With Our AI
      </Button>

      <Dialog open={openPopup} onClose={handleClosePopup} maxWidth="sm" fullWidth>
        <DialogTitle>Find the Best Influencer With Our AI</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Follow these steps to find the best influencer:
          </Typography>
          <Typography variant="body2" gutterBottom>
            1. Upload an image from your brand.
          </Typography>
          <TextField
            type="file"
            fullWidth
            onChange={(e) => setBrandImage(e.target.files[0])}
            sx={{ marginBottom: "10px" }}
          />
          <Typography variant="body2" gutterBottom>
            2. Click proceed to search for influencers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleProceedSearching} color="primary" variant="contained">
            Proceed Searching
          </Button>
        </DialogActions>
      </Dialog>

      <Container
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {filteredInfluencers.map((influencer) => (
          <Card
            key={influencer.id}
            elevation={4}
            sx={{
              width: "calc(33% - 10px)",
              height: "300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "12px",
              padding: "10px",
              position: "relative",
            }}
          >
            <Avatar
              alt={influencer.name}
              src={formatImageUrl(influencer.image)}
              sx={{ width: 80, height: 80, marginBottom: "10px" }}
            />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333", textAlign: "center" }}>
              {influencer.name}
            </Typography>
            <Typography sx={{ color: "#555", textAlign: "center" }}>Followers: {influencer.followers || "Not available"}</Typography>
            <Typography sx={{ color: "#555", textAlign: "center" }}>Platform: {influencer.platform || "Not available"}</Typography>
            <Typography sx={{ color: "#555", textAlign: "center" }}>Niche: {influencer.niche}</Typography>
            <Link to={`/show-profile/${influencer.id}`}>
              <Button
                variant="contained"
                color="primary"
                sx={{ marginTop: "10px", alignSelf: "center" }}
              >
                Show Profile
              </Button>
            </Link>
          </Card>
        ))}
      </Container>
    </Box>
  );
};

export default SearchInfluencers;