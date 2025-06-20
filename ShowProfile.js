// ShowProfile.js
// This component displays a detailed influencer profile for brands, including bio, niche, platforms, and submitted files.
// Features: like/unlike influencer, view all platform links, and browse influencer's submitted files.
// All state, effects, functions, and UI/CSS blocks are commented for clarity and maintainability.

import React, { useState, useEffect, useCallback } from "react";
import { Typography, Paper, Avatar, Box, Grid, Button, IconButton } from "@mui/material";
import { db, auth } from "../../api/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore methods
import { useParams } from "react-router-dom";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const platformLogos = {
  youtube: "/youtube logo.png",
  instagram: "/instagram logo.png",
  tiktok: "/tiktok logo.png",
  twitter: "/twitter logo.png",
  facebook: "/facebook logo.png",
};

const ShowProfile = () => {
  // Get influencer ID from URL
  const { id } = useParams();
  // State: Influencer profile data fetched from Firestore
  const [profile, setProfile] = useState(null);
  // State: Tracks whether the current brand has liked/unliked this influencer
  const [likedStatus, setLikedStatus] = useState(null);
  // State: List of files submitted by the influencer (for preview carousel)
  const [submittedFiles, setSubmittedFiles] = useState([]);
  // State: Index of the currently displayed file in the carousel
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Effect: Fetch influencer profile data from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      const userDoc = doc(db, "users", id);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const profileData = userSnapshot.data();
        setProfile({ ...profileData, uid: id }); // Ensure uid is included
      }
    };

    fetchProfile();
  }, [id]); // Only run when `id` changes

  // Function: Fetch liked status of the influencer by the current brand
  const fetchLikedStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !profile) {
      console.error("fetchLikedStatus: Missing currentUser or profile", { currentUser, profile });
      return;
    }

    const brandUid = currentUser.uid; // Use uid directly as part of the docId
    const influencerUid = profile.uid;
    if (!brandUid || !influencerUid) {
      console.error("fetchLikedStatus: Missing brandUid or influencerUid", { brandUid, influencerUid });
      return;
    }

    const docId = `${brandUid}_${influencerUid}`; // Construct docId using brandUid and influencerUid

    const likedDoc = doc(db, "liked_influencers", docId);
    const likedSnapshot = await getDoc(likedDoc);

    if (likedSnapshot.exists()) {
      const likedData = likedSnapshot.data();
      console.log("fetchLikedStatus: Fetched liked data", likedData);
      setLikedStatus(likedData.liked);
    } else {
      console.log("fetchLikedStatus: No liked data found");
      setLikedStatus(null);
    }
  }, [profile]);

  // Effect: Fetch liked status when profile or currentUser changes
  useEffect(() => {
    if (profile && auth.currentUser) {
      fetchLikedStatus(); // Ensure liked status is fetched only when profile and currentUser are available
    }
  }, [profile, fetchLikedStatus]);

  // Handler: Like the influencer
  const handleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !profile || !profile.uid) {
      console.error("Missing required data: currentUser or profile.uid is undefined", {
        currentUser,
        profile,
      });
      return;
    }

    const brandUid = currentUser.uid;
    const influencerUid = profile.uid;

    const docId = `${brandUid}_${influencerUid}`;
    const likedDoc = doc(db, "liked_influencers", docId);

    await setDoc(likedDoc, {
      brandUid,
      influencerUid,
      liked: "liked",
    });

    // Explicitly fetch the updated liked status
    await fetchLikedStatus();
  };

  // Handler: Unlike the influencer
  const handleUnlike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !profile) return;

    const brandUid = currentUser.uid;
    const influencerUid = profile.uid;

    const docId = `${brandUid}_${influencerUid}`;
    const likedDoc = doc(db, "liked_influencers", docId);

    await updateDoc(likedDoc, { liked: "unliked" });

    // Explicitly fetch the updated liked status
    await fetchLikedStatus();
  };

  // Effect: Fetch submitted files for the influencer
  useEffect(() => {
    const fetchSubmittedFiles = async () => {
      try {
        const submissionsQuery = query(
          collection(db, "order_submissions"),
          where("influencerUid", "==", id) // Match influencer UID
        );
        const querySnapshot = await getDocs(submissionsQuery);
        const files = querySnapshot.docs.map((doc) => doc.data().fileUrl); // Extract file URLs
        console.log("Fetched submitted files:", files); // Debugging log
        setSubmittedFiles(files);
      } catch (error) {
        console.error("Error fetching submitted files:", error);
      }
    };

    fetchSubmittedFiles();
  }, [id]); // Fetch files when `id` changes

  // Handler: Show previous file in the carousel
  const handlePrevFile = () => {
    setCurrentFileIndex((prevIndex) => (prevIndex === 0 ? submittedFiles.length - 1 : prevIndex - 1));
  };

  // Handler: Show next file in the carousel
  const handleNextFile = () => {
    setCurrentFileIndex((prevIndex) => (prevIndex === submittedFiles.length - 1 ? 0 : prevIndex + 1));
  };

  // Loading state while profile is being fetched
  if (!profile) {
    return <Typography>Loading...</Typography>;
  }

  // Decode the image URL to handle double encoding issues
  const decodedImage = decodeURIComponent(profile.image || "/dp.png");

  return (
    <Box
      sx={{
        backgroundImage: "url('/hero image.jpg')",
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
      <Paper
        elevation={3}
        sx={{
          width: "80%",
          padding: "30px",
          borderRadius: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          marginTop: "20px", // Added top margin
          marginBottom: "20px", // Added bottom margin
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // Align image and name with button on opposite corners
            width: "100%",
            gap: "20px",
          }}
        >
          <Avatar
            alt="Profile Image"
            src={decodedImage}
            sx={{
              width: 140, // Reduced size
              height: 140, // Reduced size
              border: "2px solid #333", // Slightly smaller border
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Added shadow effect
              marginLeft: "20px", // Added left margin
              marginBottom: "10px",
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end", // Align name and button to the right
              marginRight: "20px", // Added right margin
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#333", marginBottom: "10px" }}
            >
              {profile.name}
            </Typography>
            <Button
              variant="contained"
              color={likedStatus === "liked" ? "secondary" : "primary"}
              onClick={likedStatus === "liked" ? handleUnlike : handleLike}
              disabled={!auth.currentUser || !profile || !profile.uid} // Disable button if data is missing
              sx={{
                textTransform: "capitalize",
                fontWeight: "bold",
                padding: "8px 16px",
              }}
            >
              {likedStatus === "liked" ? "Unlike" : "Like"}
            </Button>
            {/* Debugging logs */}
            {console.log("auth.currentUser:", auth.currentUser)}
            {console.log("profile:", profile)}
            {console.log("profile.uid:", profile?.uid)}
          </Box>
        </Box>

        <Paper
          elevation={2}
          sx={{
            padding: "20px",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            width: "100%",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "#555", fontWeight: "bold", marginBottom: "10px" }}
          >
            Bio:
          </Typography>
          <Typography variant="body2" sx={{ color: "#777", marginBottom: "10px" }}>
            {profile.bio}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#555", fontWeight: "bold", marginBottom: "10px" }}
          >
            Niche:
          </Typography>
          <Typography variant="body2" sx={{ color: "#777" }}>
            {profile.niche}
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{
            padding: "20px",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            width: "100%",
          }}
        >
          <Grid container spacing={2}>
            <Grid sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ color: "#555", fontWeight: "bold" }}>
                Username:
              </Typography>
              <Typography variant="body2" sx={{ color: "#777" }}>
                {profile.username}
              </Typography>
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ color: "#555", fontWeight: "bold" }}>
                Email:
              </Typography>
              <Typography variant="body2" sx={{ color: "#777" }}>
                {profile.email}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "20px",
            width: "100%",
          }}
        >
          {profile.platforms &&
            Object.entries(profile.platforms).map(([platform, details]) => (
              details.link && details.followers && (
                <Paper
                  key={platform}
                  elevation={2}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    padding: "15px",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <img
                    src={platformLogos[platform.toLowerCase()] || "/logo192.png"}
                    alt={`${platform} logo`}
                    style={{ width: "40px", height: "40px" }}
                  />
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: "bold", color: "#333" }}
                    >
                      {platform}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#777" }}
                    >
                      Followers: {details.followers}
                    </Typography>
                  </Box>
                  <Box sx={{ marginLeft: "auto" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{
                        textTransform: "capitalize",
                        fontWeight: "bold",
                        padding: "8px 16px",
                        backgroundColor: "#1a73e8",
                        '&:hover': {
                          backgroundColor: "#1558b0",
                        },
                      }}
                      onClick={() => window.open(details.link, "_blank")}
                    >
                      Visit
                    </Button>
                  </Box>
                </Paper>
              )
            ))}
        </Box>

        {submittedFiles.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              marginTop: "20px",
            }}
          >
            <IconButton
              onClick={handlePrevFile}
              sx={{ position: "absolute", left: 0, zIndex: 1 }}
            >
              <ArrowBackIosIcon />
            </IconButton>

            <img
              src={submittedFiles[currentFileIndex]}
              alt={`Submission ${currentFileIndex + 1}`}
              style={{
                maxWidth: "80%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
              }}
            />

            <IconButton
              onClick={handleNextFile}
              sx={{ position: "absolute", right: 0, zIndex: 1 }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
        )}
        {console.log("Rendering submittedFiles:", submittedFiles)}
        {console.log("Current file index:", currentFileIndex)}
      </Paper>
    </Box>
  );
};

export default ShowProfile;