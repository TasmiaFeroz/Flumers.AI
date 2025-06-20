// BrandOrders.js
// This component allows a brand to view, create, and manage orders with influencers.
// It includes order creation, filtering, order details, review/revision handling, and file submissions.
// All logic, state, and UI blocks are explained in detail below. No code logic is changed.

import React, { useState, useEffect } from "react";
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material";
import { db, auth } from "../../api/firebaseConfig";
import { doc as firestoreDoc, getDoc, collection, query, where, getDocs, updateDoc, setDoc } from "firebase/firestore"; // Renamed `doc` to `firestoreDoc` to avoid shadowing
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import { v4 as uuidv4 } from 'uuid'; // Import UUID library
import { supabase, getImageUrl } from "../../api/supabaseConfig"; // Import Supabase configuration

const BrandOrders = () => {
  // State: All orders for this brand
  const [orders, setOrders] = useState([]);
  // State: List of liked influencers (for order creation dropdown)
  const [likedInfluencers, setLikedInfluencers] = useState([]);
  // State: Controls the visibility of the new order dialog
  const [open, setOpen] = useState(false);
  // State: Controls the visibility of the order details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  // State: Controls the visibility of the review/revision dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  // State: The currently selected order for details/review
  const [selectedOrder, setSelectedOrder] = useState(null);
  // State: Form data for creating a new order
  const [formData, setFormData] = useState({
    influencer: "",
    orderDetails: "",
    totalCost: "",
    deadline: "",
    imageFile: null, // File input for order image
  });
  // State: Current filter for order status (all/completed/remaining/pending)
  const [filter, setFilter] = useState("all");
  // State: Text for submitting a revision request
  const [revisionText, setRevisionText] = useState("");
  // State: Tracks unseen submissions for each order (for review notification)
  const [unseenSubmissions, setUnseenSubmissions] = useState({});

  // Effect: Fetch orders for the current brand user on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchOrders(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch orders from Firestore for the current brand
  const fetchOrders = async (user) => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("brandUid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const fetchedOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return data;
        });
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Effect: Fetch liked influencers for the brand (for order creation)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchLikedInfluencers(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch liked influencers from Firestore and their details
  const fetchLikedInfluencers = async (currentUser) => {
    try {
      const likedRef = collection(db, "liked_influencers");
      const q = query(likedRef, where("brandUid", "==", currentUser.uid), where("liked", "==", "liked"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return;
      }
      // For each liked influencer, fetch their user details
      const influencers = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          if (data.influencerUid) {
            try {
              const userDoc = firestoreDoc(db, "users", data.influencerUid);
              const userSnapshot = await getDoc(userDoc);
              if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                // Decode the image URL to handle double encoding issues
                const decodedImage = decodeURIComponent(userData.image || "/dp.png");
                return {
                  username: userData.username || "Unknown",
                  image: decodedImage,
                  uid: data.influencerUid, // Include influencer UID
                };
              } else {
                return null;
              }
            } catch (error) {
              console.error("Error fetching user for influencerUid:", data.influencerUid, error);
              return null;
            }
          } else {
            return null;
          }
        })
      );
      setLikedInfluencers(influencers.filter(Boolean)); // Remove null entries
    } catch (error) {
      console.error("Error fetching liked influencers:", error);
    }
  };

  // Helper: Calculate remaining time for an order (days, hours, minutes, seconds)
  const calculateRemainingTime = (startTime, deadline) => {
    const now = new Date();
    const start = startTime.toDate ? startTime.toDate() : new Date(startTime); // Convert Firestore timestamp to Date if needed
    const deadlineTime = new Date(start.getTime() + deadline * 24 * 60 * 60 * 1000);
    const diff = deadlineTime - now;
    if (diff <= 0) return "00:00:00:00"; // Timer expired
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Effect: Update remaining time for running orders every second
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

  // Dialog open/close handlers for new order
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Dialog open/close handlers for order details
  const handleDetailsOpen = (order) => {
    // Add calculated remaining time to the selected order
    const updatedOrder = {
      ...order,
      remainingTime: order.startTime ? calculateRemainingTime(order.startTime, order.deadline) : "Not Started",
    };
    setSelectedOrder(updatedOrder);
    setDetailsOpen(true);
  };
  const handleDetailsClose = () => {
    setSelectedOrder(null);
    setDetailsOpen(false);
  };

  // Dialog open/close handlers for review/revision
  const handleReviewDialogOpen = (order) => {
    if (order.status === "pending") return; // Do not open review dialog for pending orders
    setSelectedOrder(order);
    setReviewDialogOpen(true);
  };
  const handleReviewDialogClose = () => {
    setSelectedOrder(null);
    setReviewDialogOpen(false);
  };

  // Handle form input changes for new order creation
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value, // Handle file input
    }));
  };

  // Handle new order submission (creates a new order in Firestore and uploads image to Supabase)
  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      // Fetch all existing orders to determine the next order number
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);
      let maxOrderNumber = 999; // Start from 1000
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.orderNumber && orderData.orderNumber > maxOrderNumber) {
          maxOrderNumber = orderData.orderNumber;
        }
      });
      const newOrderNumber = maxOrderNumber + 1;
      const orderId = uuidv4(); // Generate a unique ID for the order
      // Upload image to Supabase (if provided)
      let imageUrl = "";
      if (formData.imageFile) {
        // Sanitize file name
        const sanitizedFileName = formData.imageFile.name
          .replace(/[^a-zA-Z0-9.]/g, "_")
          .toLowerCase();
        const uniqueFilePath = `orders/${orderId}/${sanitizedFileName}`;
        // Only use 'error' from the destructured result, remove 'data' to avoid eslint warning
        const { error } = await supabase.storage
          .from("order-images")
          .upload(uniqueFilePath, formData.imageFile);
        if (error) {
          console.error("Error uploading image to Supabase", error);
          imageUrl = null;
        } else {
          imageUrl = getImageUrl("order-images", uniqueFilePath);
        }
      }
      // Prepare new order data (excluding imageFile)
      const { imageFile, ...orderData } = formData;
      const newOrder = {
        id: orderId,
        orderNumber: newOrderNumber,
        ...orderData,
        ...(imageUrl ? { imageUrl } : {}),
        brandUid: user.uid,
        influencerUid: likedInfluencers.find(
          (influencer) => influencer.username === formData.influencer
        )?.uid,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      // Save the new order to Firestore
      const orderDocRef = firestoreDoc(db, "orders", newOrder.id);
      await setDoc(orderDocRef, newOrder);
      setOrders((prevOrders) => [...prevOrders, newOrder]);
      handleClose();
    } catch (error) {
      console.error("Error saving order to Firestore", error);
    }
  };

  // Handle updating the status of an order (e.g., to 'revise' or 'completed')
  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("id", "==", orderId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.error(`Order with ID ${orderId} does not exist in Firestore.`);
        console.log("Available orders in state:", orders);
        return;
      }
      const orderDocRef = querySnapshot.docs[0].ref;
      await updateDoc(orderDocRef, {
        status,
      });
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      handleReviewDialogClose();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Handle submitting a revision request for an order
  const handleReviseSubmit = async (text) => {
    if (!selectedOrder) return;
    try {
      const orderRef = firestoreDoc(db, "orders", selectedOrder.id);
      const orderSnap = await getDoc(orderRef);
      let revisions = [];
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        if (orderData.revisions && Array.isArray(orderData.revisions)) {
          revisions = orderData.revisions;
        }
      }
      revisions.push({
        text,
        revisedAt: new Date().toISOString(),
      });
      await updateDoc(orderRef, { revisions });
      console.log("Revision added successfully");
      setReviewDialogOpen(false);
    } catch (error) {
      console.error("Error adding revision:", error);
    }
  };

  // Filter orders by status for display (all/completed/remaining/pending)
  const filteredOrders = orders.filter((order) => {
    if (filter === "completed") return order.status === "completed";
    if (filter === "remaining") return order.status === "remaining";
    if (filter === "pending") return order.status === "pending";
    return true;
  });

  // Sort orders by order number (ascending)
  const sortedOrders = filteredOrders.sort((a, b) => a.orderNumber - b.orderNumber);

  // Render review dialog actions (Revise/Completed buttons)
  const renderReviewDialogActions = () => {
    if (selectedOrder?.status === "completed") {
      return null;
    }
    return (
      <>
        <Button onClick={() => handleOrderStatusUpdate(selectedOrder.id, "completed")} color="primary" variant="contained">
          Completed
        </Button>
      </>
    );
  };

  // Effect: Fetch unseen submissions for each order (for review notification)
  useEffect(() => {
    const fetchUnseenSubmissions = async () => {
      const user = auth.currentUser;
      if (user) {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("brandUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const unseen = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.submission && Array.isArray(data.submission.files)) {
            const unseenCount = data.submission.files.filter((file) => !file.seenByBrand).length;
            if (unseenCount > 0) {
              unseen[doc.id] = unseenCount;
            }
          }
        });
        setUnseenSubmissions(unseen);
      }
    };
    fetchUnseenSubmissions();
  }, [orders]);

  // Mark all submissions for an order as seen by the brand
  const markSubmissionsAsSeen = async (orderId) => {
    try {
      const orderRef = firestoreDoc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        if (orderData.submission && Array.isArray(orderData.submission.files)) {
          const updatedFiles = orderData.submission.files.map((file) => ({
            ...file,
            seenByBrand: true,
          }));
          await updateDoc(orderRef, { submission: { files: updatedFiles } });
          setUnseenSubmissions((prev) => {
            const updated = { ...prev };
            delete updated[orderId];
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Error marking submissions as seen:", error);
    }
  };

  // --- UI Rendering ---
  // The UI includes:
  // 1. Orders summary and filter buttons (New Order, filter by status)
  // 2. Orders table: shows all orders with status, influencer, cost, and actions (Details, Review)
  // 3. Dialog for creating a new order (form with influencer, details, cost, deadline, image upload)
  // 4. Dialog for viewing order details (shows all order info and image)
  // 5. Dialog for reviewing submissions (shows submitted files, allows revision/complete actions)
  return (
    <Box
      // Main background and layout for the orders page
      sx={{
        backgroundImage: "url('/hero image.jpg')", // Sets a hero background image for branding
        backgroundSize: "cover", // Ensures the image covers the whole area
        backgroundPosition: "center", // Centers the background image
        backgroundRepeat: "no-repeat", // Prevents image repetition
        backgroundColor: "#F0F2F5", // Fallback background color
        minHeight: "calc(100vh - 64px)", // Ensures full viewport height minus header
        width: "100vw", // Full viewport width
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        top: 0,
        '@media (max-width: 600px)': {
          padding: "16px", // Responsive padding for mobile
        },
      }}
    >
      <Box
        // Card container for the orders summary and table
        sx={{
          border: "1px solid #ccc", // Card border
          borderRadius: "16px", // Rounded corners for card
          padding: "24px", // Card padding
          backgroundColor: "#fff", // Card background
          width: "80%", // Card width
          maxWidth: "100%", // Prevents overflow
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", // Card shadow for depth
          transition: "transform 0.3s ease, box-shadow 0.3s ease", // Smooth hover effect
          '&:hover': {
            transform: "scale(1.03)", // Slightly enlarges card on hover
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)", // Stronger shadow on hover
          },
          '@media (max-width: 600px)': {
            padding: "16px",
            width: "100%",
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          // Main heading for the orders summary card at the top of the page
          sx={{
            textAlign: "center", // Centered heading
            fontWeight: "bold", // Bold font
            color: "#333", // Dark text color
            marginBottom: "24px", // Space below heading
            animation: "fadeIn 1s ease-in-out", // Fade-in animation
            '@media (max-width: 600px)': {
              fontSize: "1.5rem", // Smaller font on mobile
            },
          }}
        >
          Orders Summary
        </Typography>
        <Button
          // Button to open the new order dialog (used at the top of the orders summary card)
          onClick={handleOpen}
          variant="contained"
          color="primary"
          sx={{
            marginBottom: "24px", // Space below button
            padding: "12px 24px", // Button padding
            fontWeight: "bold", // Bold text
            borderRadius: "12px", // Rounded button
            background: "linear-gradient(135deg, #FF6EC7 0%, #4A90E2 100%)", // Gradient background
            transition: "all 0.3s ease", // Smooth hover effect
            '&:hover': {
              background: "linear-gradient(135deg, #4A90E2 0%, #FF6EC7 100%)", // Reverse gradient on hover
              transform: "scale(1.05)", // Slightly enlarge on hover
            },
            '@media (max-width: 600px)': {
              padding: "10px 20px",
              fontSize: "0.9rem",
            },
          }}
        >
          New Order
        </Button>
        <Box
          // Box containing the filter buttons (All, Completed, Remaining, Pending) for filtering orders
          sx={{
            display: "flex", // Horizontal layout
            justifyContent: "center", // Centered
            gap: "16px", // Space between buttons
            marginBottom: "24px", // Space below
            animation: "fadeIn 1s ease-in-out", // Fade-in animation
            flexWrap: "wrap", // Wrap on small screens
            '@media (max-width: 600px)': {
              gap: "8px",
            },
          }}
        >
          {['all', 'completed', 'remaining', 'pending'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? "contained" : "outlined"}
              onClick={() => setFilter(type)}
              sx={{
                padding: "10px 20px",
                borderRadius: "12px",
                fontWeight: "bold",
                backgroundColor: filter === type ? "#4A90E2" : "transparent",
                color: filter === type ? "#fff" : "#000",
                transition: "all 0.3s ease",
                '&:hover': {
                  backgroundColor: "#4A90E2",
                  color: "#fff",
                },
                '@media (max-width: 600px)': {
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                },
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Orders
            </Button>
          ))}
        </Box>
        <TableContainer
          // TableContainer for the orders table (shows all orders in a scrollable table)
          sx={{
            maxHeight: "360px", // Table max height with scroll
            overflowY: "auto", // Vertical scroll for table
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", // Table shadow
            borderRadius: "16px", // Rounded corners
            backgroundColor: "#fff", // White background
          }}
        >
          <Table stickyHeader sx={{ backgroundColor: "#fff" }}>
            <TableHead>
              <TableRow>
                {['Order ID', 'Influencer', 'Status', 'Total Cost', 'Actions'].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: "bold",
                      color: "#333",
                      '@media (max-width: 600px)': {
                        fontSize: "0.8rem",
                      },
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: "bold", color: "#333" }}>
                  Complete
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders.map((order, index) => (
                <TableRow
                  key={index}
                  sx={{
                    transition: "background-color 0.3s ease",
                    '&:hover': {
                      backgroundColor: "rgba(0, 123, 255, 0.1)",
                    },
                  }}
                >
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.influencer}</TableCell>
                  <TableCell>
                    {order.status === "completed" && (
                      <Typography variant="body2" color="green">
                        Completed
                      </Typography>
                    )}
                    {order.status === "pending" && (
                      <Typography variant="body2" color="orange">
                        Pending
                      </Typography>
                    )}
                    {order.status === "remaining" && (
                      <Typography variant="body2" color="blue">
                        In Progress
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>Rs {order.totalCost}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleDetailsOpen(order)}
                      sx={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        transition: "all 0.3s ease",
                        '&:hover': {
                          backgroundColor: "#4A90E2",
                          transform: "scale(1.05)",
                        },
                        '@media (max-width: 600px)': {
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                        },
                      }}
                    >
                      Details
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        handleReviewDialogOpen(order);
                        markSubmissionsAsSeen(order.id);
                      }}
                      sx={{ position: "relative" }}
                    >
                      Review
                      {unseenSubmissions[order.id] && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "16px",
                            height: "16px",
                            backgroundColor: "red",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          {unseenSubmissions[order.id]}
                        </Box>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog
        open={open} // Ensure the dialog is controlled by the `open` state
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="new-order-dialog-title"
        aria-describedby="new-order-dialog-description"
        disableEnforceFocus
      >
        <DialogTitle id="new-order-dialog-title"></DialogTitle>
        <DialogContent
          // DialogContent for the new order form dialog
          // CSS: Adds padding, light background, rounded corners, and subtle shadow for a card-like appearance
          sx={{
            padding: "24px", // Space inside the dialog
            backgroundColor: "#f9f9f9", // Light gray background for contrast
            borderRadius: "12px", // Rounded corners for a soft look
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for elevation
          }}
        >
          {/* Typography for the dialog title */}
          {/* CSS: Centered, bold, dark text, with margin below for spacing */}
          <Typography
            variant="h5"
            sx={{
              textAlign: "center", // Center the title
              fontWeight: "bold", // Make the title bold
              color: "#333", // Dark text for readability
              marginBottom: "20px", // Space below the title
            }}
          >
            Create New Order
          </Typography>
          {/* Form container for new order fields */}
          {/* CSS: Vertical flex layout, with spacing between fields */}
          <Box
            component="form"
            sx={{
              display: "flex", // Vertical flex layout
              flexDirection: "column", // Stack children vertically
              gap: "16px", // Space between form fields
            }}
          >
            <TextField
              select
              fullWidth
              margin="normal"
              label="Select Influencer"
              name="influencer"
              value={formData.influencer}
              onChange={handleChange}
              required
              sx={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {likedInfluencers.map((influencer, index) => (
                <MenuItem key={index} value={influencer.username}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={influencer.image || "/dp.png"}
                      alt={influencer.username}
                      style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                    />
                    {influencer.username}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label="Order Details"
              name="orderDetails"
              value={formData.orderDetails}
              onChange={handleChange}
              required
              multiline
              rows={4}
              sx={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Total Cost (Rs)"
              name="totalCost"
              type="number"
              value={formData.totalCost}
              onChange={handleChange}
              required
              sx={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
            <TextField
              select
              fullWidth
              margin="normal"
              label="Days to Complete Order"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              sx={{
                backgroundColor: "#fff", // White background for dropdown
                borderRadius: "8px", // Rounded corners for dropdown
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow for dropdown
              }}
            >
              {[...Array(30).keys()].map((day) => (
                <MenuItem key={day + 1} value={day + 1}>
                  {day + 1} {day + 1 === 1 ? "day" : "days"}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label="Upload Image"
              name="imageFile"
              type="file"
              InputLabelProps={{ shrink: true }}
              onChange={handleChange}
              sx={{
                backgroundColor: "#fff", // White background for file input
                borderRadius: "8px", // Rounded corners for file input
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow for file input
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleClose}
            color="secondary"
            variant="outlined"
            sx={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              transition: "all 0.3s ease",
              '&:hover': {
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            sx={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #FF6EC7 0%, #4A90E2 100%)",
              transition: "all 0.3s ease",
              '&:hover': {
                background: "linear-gradient(135deg, #4A90E2 0%, #FF6EC7 100%)",
                transform: "scale(1.05)",
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={detailsOpen}
        onClose={handleDetailsClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {selectedOrder && (
            <Box
              sx={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <Typography
                variant="h4"
                sx={{ textAlign: "center", fontWeight: "bold", color: "#333" }}
              >
                Order Details
              </Typography>
              <Box
                // Grid layout for order details section in the dialog
                // CSS: Uses two columns to neatly display order info side by side
                sx={{
                  display: "grid", // Enables CSS grid layout
                  gridTemplateColumns: "1fr 1fr", // Two equal-width columns
                  gap: "20px", // Space between columns and rows
                  alignItems: "center", // Vertically center content in each grid cell
                }}
              >
                {/*
                  Each Box below represents a single order detail field (Order Number, Influencer, etc.)
                  The Typography components inside each Box are styled for label/value clarity.
                */}
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Order Number:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    #{selectedOrder.orderNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Influencer:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {selectedOrder.influencer}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Total Cost:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    Rs {selectedOrder.totalCost}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Deadline:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {selectedOrder.deadline} {selectedOrder.deadline === 1 ? "day" : "days"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Status:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color:
                        selectedOrder.status === "completed"
                          ? "green"
                          : "orange",
                    }}
                  >
                    {selectedOrder.status}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="textSecondary">
                    Time Remaining:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: selectedOrder.status === "completed" ? "green" : selectedOrder.remainingTime === "00:00:00:00" ? "red" : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedOrder.status === "completed"
                      ? "Order delivered in time"
                      : selectedOrder.remainingTime || "Not Started"}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Order Details:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    backgroundColor: "#fff",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {selectedOrder.orderDetails}
                </Typography>
              </Box>
              {selectedOrder.imageUrl && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '20px',
                  }}
                >
                  <Typography variant="subtitle1" color="textSecondary">
                    Order Image:
                  </Typography>
                  <img
                    src={selectedOrder.imageUrl}
                    alt="Order"
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                      marginBottom: '10px',
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    href={selectedOrder.imageUrl}
                    download
                    sx={{
                      textTransform: 'none',
                    }}
                  >
                    Download Image
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {/* Review Submission Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={handleReviewDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Submission</DialogTitle>
        <DialogContent>
          {/*
            Review Submission Dialog Content
            - Shows submitted files (images/videos) for the selected order.
            - Allows the brand to submit revision text and mark the order as revised or completed.
            - All CSS (sx) blocks are commented for clarity.
          */}
          {selectedOrder?.submission?.files && selectedOrder.submission.files.length > 0 ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Submitted Files:
              </Typography>
              <Box
                // CSS: Vertical column layout for submitted files, with spacing between each file
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {selectedOrder.submission.files.map((file, idx) => {
                  const isImage = file.fileType && file.fileType.startsWith("image");
                  const isVideo = file.fileType && file.fileType.startsWith("video");
                  return (
                    <Box
                      key={idx}
                      // CSS: Adds margin below and centers content for each file preview
                      sx={{ mb: 2, textAlign: "center" }}
                    >
                      <Typography variant="subtitle2" color="textSecondary">
                        File {idx + 1}:
                      </Typography>
                      {isImage ? (
                        <img
                          src={file.fileUrl}
                          alt={`Submitted File ${idx + 1}`}
                          /*
                            CSS for submitted image preview:
                            - width: "100%" ensures the image fills the container width
                            - maxWidth: "180px" restricts the preview size for a neat look
                            - height: "auto" keeps the aspect ratio
                            - borderRadius: "8px" gives rounded corners for a modern card look
                            - boxShadow: subtle shadow for depth and separation from background
                            - marginBottom: space below the image for visual separation
                            - objectFit: "cover" ensures the image covers the box without distortion
                          */
                          style={{
                            width: "100%",
                            maxWidth: "180px", // Restricts image width for preview
                            height: "auto",
                            borderRadius: "8px", // Rounded corners for image
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for image
                            marginBottom: "8px",
                            objectFit: "cover" // Ensures image covers the box
                          }}
                        />
                      ) : isVideo ? (
                        <video
                          src={file.fileUrl}
                          controls
                          /*
                            CSS for submitted video preview:
                            - width: "100%" and maxWidth: "180px" for responsive, neat video preview
                            - borderRadius: "8px" for rounded corners
                            - boxShadow: subtle shadow for depth
                            - marginBottom: space below the video
                            - objectFit: "cover" for consistent aspect ratio
                          */
                          style={{
                            width: "100%",
                            maxWidth: "180px", // Restricts video width for preview
                            borderRadius: "8px", // Rounded corners for video
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for video
                            marginBottom: "8px",
                            objectFit: "cover" // Ensures video covers the box
                          }}
                        />
                      ) : null}
                      <a
                        href={file.fileUrl + `?download`}
                        download={
                          isImage ? `image${idx + 1}.${file.fileType.split('/')[1]}` :
                          isVideo ? `video${idx + 1}.${file.fileType.split('/')[1]}` :
                          `file${idx + 1}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outlined"
                          color="primary"
                          // CSS: Small round download button with icon
                          sx={{ mt: 1, minWidth: 0, padding: 1, borderRadius: "50%" }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 16.5a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v10.5a1 1 0 0 1-1 1Z"/>
                            <path fill="currentColor" d="M7.21 13.79a1 1 0 0 1 1.42-1.42L11 14.66V5a1 1 0 1 1 2 0v9.66l2.37-2.29a1 1 0 1 1 1.42 1.42l-4.08 4a1 1 0 0 1-1.42 0l-4.08-4Z"/>
                            <path fill="currentColor" d="M5 20a1 1 0 0 1 0-2h14a1 1 0 1 1 0 2H5Z"/>
                          </svg>
                        </Button>
                      </a>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No files submitted yet.
            </Typography>
          )}
          <Box
            // CSS: Adds margin above the revision form for spacing
            sx={{ marginTop: "20px" }}
          >
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your revision text here..."
              variant="outlined"
              onChange={(e) => setRevisionText(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              // CSS: Adds margin above the submit button for spacing
              sx={{ marginTop: "10px" }}
              onClick={() => handleReviseSubmit(revisionText)}
            >
              Submit Revision
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReviewDialogClose} color="secondary">
            Cancel
          </Button>
          {renderReviewDialogActions()}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrandOrders;