// BrandDashboard.js
// This component provides a dashboard for brand users, displaying their profile, order summary, and message notifications from influencers.

import React, { useState, useEffect } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button, Card } from "@mui/material";
import { db, auth } from "../../api/firebaseConfig";
import { doc as firestoreDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";

const BrandDashboard = () => {
  // State for storing all orders related to the brand
  const [orders, setOrders] = useState([]);
  // State for storing brand's profile information
  const [userInfo, setUserInfo] = useState({
    brandName: "",
    website: "",
    email: "",
    niche: "",
    username: "",
    name: "",
    aboutBrand: "",
    image: "",
  });
  // State for unseen message counts from each influencer
  const [unseenMessages, setUnseenMessages] = useState({});
  // State for storing influencer details (name, image, etc.)
  const [influencerDetails, setInfluencerDetails] = useState({});
  // React Router navigation hook
  const navigate = useNavigate();

  // useEffect: Fetch brand user data, orders, and unseen messages on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = firestoreDoc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          console.log("Fetched user data:", userData); // Debugging log

          // Fetch orders from the 'orders' collection using brandUid
          const brandUid = user.uid; // Assuming brandUid is the user's UID
          console.log("Using brandUid for orders query:", brandUid); // Debugging log

          try {
            const ordersRef = collection(db, "orders");
            const q = query(ordersRef, where("brandUid", "==", brandUid));
            const ordersSnapshot = await getDocs(q);

            if (ordersSnapshot.empty) {
              console.warn("No orders found for brandUid:", brandUid); // Log if no orders are found
            } else {
              const fetchedOrders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              console.log("Fetched orders:", fetchedOrders); // Debugging log
              setOrders(fetchedOrders);
            }
          } catch (error) {
            console.error("Error fetching orders for brandUid:", brandUid, error); // Log any errors
          }

          setUserInfo({
            brandName: userData.brandName || "",
            website: userData.website || "",
            email: userData.email || "",
            niche: userData.niche || "",
            username: userData.username || "",
            name: userData.name || "",
            aboutBrand: userData.aboutBrand || "",
            image: decodeURIComponent(userData.image || ""), // Decode the image URL to handle double encoding issues
          });

          // Fetch unseen messages
          const messages = {};
          for (const order of userData.orders || []) {
            const chatId = `${user.uid}_${order.influencer}`;
            console.log("Fetching messages for chatId:", chatId); // Debugging log

            // Enhanced debugging for unseen messages
            console.log("Order influencer:", order.influencer); // Log influencer ID from order
            console.log("Constructed chatId:", chatId); // Log constructed chatId

            try {
              const chatRef = collection(db, "Messages", chatId, "messages");
              const chatSnapshot = await getDocs(chatRef);

              if (chatSnapshot.empty) {
                console.warn(`No messages subcollection found for chatId: ${chatId}`); // Log if subcollection is missing
                continue; // Skip to the next order
              }

              // Temporarily fetch all messages without filters for debugging
              const q = query(chatRef); // Removed where conditions
              const snapshot = await getDocs(q);

              if (snapshot.empty) {
                console.warn(`No messages found for chatId: ${chatId}`); // Log if no messages are found
              } else {
                console.log("Messages count for", chatId, ":", snapshot.size); // Debugging log
                snapshot.forEach((doc) => {
                  console.log("Message document:", doc.data()); // Log each message document
                });
                messages[order.influencer] = snapshot.size; // Count all messages for now
              }
            } catch (error) {
              console.error(`Error fetching messages for chatId: ${chatId}`, error); // Log any errors
            }
          }

          // Debugging unseen messages logic
          console.log("Unseen messages before setting state:", messages); // Log unseen messages object before setting state
          setUnseenMessages(messages);
        }
      }
    };

    fetchUserData();
  }, []);

  // useEffect: Fetch liked influencers and their unseen messages on mount
  useEffect(() => {
    const fetchLikedInfluencersAndMessages = async () => {
      const user = auth.currentUser;
      if (user) {
        const brandUid = user.uid;
        console.log("Fetching liked influencers for brandUid:", brandUid); // Debugging log

        try {
          const likedInfluencersRef = collection(db, "liked_influencers");
          const q = query(likedInfluencersRef, where("brandUid", "==", brandUid));
          const likedInfluencersSnapshot = await getDocs(q);

          if (likedInfluencersSnapshot.empty) {
            console.warn("No liked influencers found for brandUid:", brandUid); // Log if no liked influencers are found
          } else {
            const messages = {};
            const influencerDetails = {};

            for (const doc of likedInfluencersSnapshot.docs) {
              const { influencerUid } = doc.data();
              const chatIdentifier = `${brandUid}_${influencerUid}`;
              console.log("Constructed chatIdentifier:", chatIdentifier); // Debugging log

              try {
                const chatCollectionRef = collection(db, "Messages", chatIdentifier, "messages");
                const unseenMessagesQuery = query(chatCollectionRef, where("read", "==", false));
                const unseenMessagesSnapshot = await getDocs(unseenMessagesQuery);

                if (!unseenMessagesSnapshot.empty) {
                  messages[influencerUid] = unseenMessagesSnapshot.size;

                  // Fetch influencer details
                  const influencerDocRef = firestoreDoc(db, "users", influencerUid);
                  const influencerDoc = await getDoc(influencerDocRef);
                  if (influencerDoc.exists()) {
                    influencerDetails[influencerUid] = influencerDoc.data();
                  }
                }
              } catch (error) {
                console.error(`Error fetching unseen messages for chatIdentifier ${chatIdentifier}:`, error);
              }
            }

            console.log("Unseen messages before setting state:", messages); // Debugging log
            setUnseenMessages(messages);
            setInfluencerDetails(influencerDetails);
          }
        } catch (error) {
          console.error("Error fetching liked influencers for brandUid:", brandUid, error);
        }
      }
    };

    fetchLikedInfluencersAndMessages();
  }, []);

  // Function: Calculate remaining time for an order (days, hours, minutes, seconds)
  const calculateRemainingTime = (startTime, deadline) => {
    const now = new Date();
    const start = startTime && startTime.toDate ? startTime.toDate() : new Date(startTime || Date.now()); // Handle undefined or invalid startTime
    const deadlineTime = new Date(start.getTime() + deadline * 24 * 60 * 60 * 1000);
    const diff = deadlineTime - now;

    if (diff <= 0) return "00:00:00:00"; // Timer expired

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // useEffect: Update remaining time for running orders every second
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.status === "running" && order.startTime) {
            const remainingTime = calculateRemainingTime(order.startTime, order.deadline);
            return {
              ...order,
              remainingTime,
            };
          }
          return order;
        })
      );
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Filter orders by status for summary display
  const completedOrders = orders.filter((order) => order.status === "completed");
  const runningOrders = orders.filter((order) => order.status === "remaining");
  const pendingOrders = orders.filter((order) => order.status === "pending");

  // --- UI Rendering ---
  return (
    // Main dashboard background and layout
    <Box
      sx={{
        backgroundImage: "url('/hero image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        padding: "30px",
      }}
    >
      {/* Main content container (left side) */}
      <Container
        sx={{
          flex: 3,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "40px",
          marginTop: "20px",
        }}
      >
        {/* --- Message Notifications Card --- */}
        <Card
          elevation={8}
          sx={{
            width: "calc(50% - 20px)",
            height: "250px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            '&:hover': {
              transform: "scale(1.05)",
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          {/* Card title */}
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#333", marginBottom: "15px" }}
          >
            Message Notifications
          </Typography>
          {/* Divider */}
          <Box
            sx={{ width: "100%", height: "3px", backgroundColor: "#ccc", margin: "15px 0" }}
          />
          {/* List of influencers with unseen messages */}
          {Object.keys(unseenMessages).length > 0 ? (
            <TableContainer>
              <Table>
                <TableBody>
                  {Object.entries(unseenMessages).map(([influencerUid, count]) => {
                    const influencer = influencerDetails[influencerUid] || {};
                    return (
                      <TableRow
                        key={influencerUid}
                        hover
                        onClick={() => navigate(`/brand-chats`)}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: "16px",
                          padding: "12px 20px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "30px",
                        }}
                      >
                        {/* Influencer avatar and name */}
                        <TableCell sx={{ display: "flex", alignItems: "center", gap: "15px" }}>
                          <img
                            src={influencer.image || "/dp.png"}
                            alt={influencer.name || "Influencer"}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "50%",
                              border: "3px solid #43a047",
                            }}
                          />
                          <Typography sx={{ fontWeight: "bold", color: "#2e7d32", fontSize: "1rem" }}>
                            {influencer.name || influencerUid}
                          </Typography>
                        </TableCell>
                        {/* Unseen message count */}
                        <TableCell sx={{ textAlign: "right" }}>
                          <Box
                            sx={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: "#43a047",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                            }}
                          >
                            {count}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: "#555" }}>No new messages</Typography>
          )}
        </Card>

        {/* --- Order Summary Card --- */}
        <Card
          elevation={8}
          sx={{
            width: "calc(50% - 20px)",
            height: "250px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            '&:hover': {
              transform: "scale(1.05)",
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          {/* Card title */}
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#333", marginBottom: "15px" }}
          >
            Order Summary
          </Typography>
          {/* Divider */}
          <Box
            sx={{ width: "100%", height: "3px", backgroundColor: "#ccc", margin: "15px 0" }}
          />
          {/* Order status summary */}
          <Box sx={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
            <Typography sx={{ fontWeight: "bold", color: "#333" }}>
              Completed: {completedOrders.length}
            </Typography>
            <Typography sx={{ fontWeight: "bold", color: "#333" }}>
              Running: {runningOrders.length}
            </Typography>
            <Typography sx={{ fontWeight: "bold", color: "#333" }}>
              Pending: {pendingOrders.length}
            </Typography>
          </Box>
        </Card>

        {/* --- Orders Table Card --- */}
        <Card
          elevation={8}
          sx={{
            width: "100%",
            height: "350px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            '&:hover': {
              transform: "scale(1.05)",
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          {/* Card title */}
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#333", marginBottom: "15px" }}
          >
            Orders
          </Typography>
          {/* Divider */}
          <Box
            sx={{ width: "100%", height: "3px", backgroundColor: "#ccc", margin: "15px 0" }}
          />
          {/* Orders table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", color: "#333" }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#333" }}>Influencer</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#333" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#333" }}>Time Left</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "#333" }}>Total Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}
                  >
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.influencer}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>
                      {order.status === "completed"
                        ? "Completed"
                        : order.remainingTime || calculateRemainingTime(order.startTime, order.deadline)}
                    </TableCell>
                    <TableCell>{order.totalCost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Container>

      {/* --- Sidebar with brand profile info (right side) --- */}
      <Box
        sx={{
          flex: 1.2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "20px",
          marginTop: "20px",
          height: "calc(100vh - 50px)",
          overflow: "auto",
        }}
      >
        {/* Brand logo/avatar */}
        <img
          src={decodeURIComponent(userInfo.image || "/dp.png")}
          alt="Brand Logo"
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            marginBottom: "20px",
            border: "3px solid #555",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
          }}
        />
        {/* Username section */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f5f5f5",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#333", fontSize: "1.2rem" }}
          >
            Username:
          </Typography>
          <Typography variant="body1" sx={{ color: "#555", fontSize: "1rem", lineHeight: "1.5" }}>
            {userInfo.username}
          </Typography>
        </Box>
        {/* Brand name section */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f5f5f5",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#333", fontSize: "1.2rem" }}
          >
            Brand Name:
          </Typography>
          <Typography variant="body1" sx={{ color: "#555", fontSize: "1rem", lineHeight: "1.5" }}>
            {userInfo.brandName}
          </Typography>
        </Box>
        {/* Name section */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f5f5f5",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#333", fontSize: "1.2rem" }}
          >
            Name:
          </Typography>
          <Typography variant="body1" sx={{ color: "#555", fontSize: "1rem", lineHeight: "1.5" }}>
            {userInfo.name}
          </Typography>
        </Box>
        {/* Niche section */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f5f5f5",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#333", fontSize: "1.2rem" }}
          >
            Niche:
          </Typography>
          <Typography variant="body1" sx={{ color: "#555", fontSize: "1rem", lineHeight: "1.5" }}>
            {userInfo.niche}
          </Typography>
        </Box>
        {/* Visit Website button */}
        <Button
          variant="contained"
          color="primary"
          sx={{
            marginTop: "20px",
            padding: "12px 25px",
            fontSize: "1rem",
            fontWeight: "bold",
            textTransform: "none",
            borderRadius: "10px",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            '&:hover': {
              backgroundColor: "#0056b3",
              transform: "scale(1.05)",
            },
          }}
          onClick={() => {
            if (userInfo.website && userInfo.website.startsWith("http")) {
              window.open(userInfo.website, "_blank");
            } else if (userInfo.website) {
              window.open(`https://${userInfo.website}`, "_blank");
            }
          }}
        >
          Visit Website
        </Button>
      </Box>
    </Box>
  );
};

export default BrandDashboard;