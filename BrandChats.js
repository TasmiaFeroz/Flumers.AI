// Importing React and necessary hooks for state management and lifecycle methods.
import React, { useState, useEffect } from "react";

// Importing Material-UI components for UI elements like Typography, Box, List, etc.
import { Typography, Box, List, ListItem, ListItemText, TextField, Button } from "@mui/material";

// Importing Firebase configuration and authentication modules.
import { db, auth } from "../../api/firebaseConfig";

// Importing Firebase Firestore methods for database operations.
import { collection, query, where, getDocs, addDoc, deleteDoc, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

// Importing useLocation hook from React Router to access query parameters.
import { useLocation } from "react-router-dom";

// Importing the logo image for display purposes.
import logo from "../../logo.png";

// This component represents the chat interface for brands to communicate with influencers.
// It includes two main sections: a list of influencers and a chat panel.

const BrandChats = () => {
  // State to store the list of influencers liked by the brand.
  const [influencers, setInfluencers] = useState([]);

  // State to store the currently selected influencer for chat.
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);

  // State to store the chat history between the brand and the selected influencer.
  const [chatHistory, setChatHistory] = useState([]);

  // State to store the new message typed by the user.
  const [newMessage, setNewMessage] = useState("");

  // State to track whether the selected influencer is blocked.
  const [isBlocked, setIsBlocked] = useState(false);

  // Hook to access the current location and query parameters.
  const location = useLocation();

  // useEffect to fetch the list of liked influencers from the database.
  useEffect(() => {
    const fetchLikedInfluencers = async () => {
      const currentUser = auth.currentUser; // Get the currently logged-in user.
      if (!currentUser) {
        console.error("No current user found."); // Log an error if no user is found.
        return;
      }

      const brandUid = currentUser.uid; // Get the UID of the logged-in brand.
      console.log("Current brandUid:", brandUid); // Debugging log.

      try {
        const likedInfluencersRef = collection(db, "liked_influencers"); // Reference to the liked influencers collection.
        const q = query(
          likedInfluencersRef,
          where("brandUid", "==", brandUid), // Filter influencers liked by the current brand.
          where("liked", "==", "liked") // Ensure the influencers are marked as liked.
        );
        const snapshot = await getDocs(q); // Fetch the documents matching the query.

        console.log("Liked influencers snapshot:", snapshot.docs); // Debugging log.

        const influencerIds = snapshot.docs.map((doc) => doc.data().influencerUid); // Extract influencer UIDs.
        console.log("Extracted influencer UIDs:", influencerIds); // Debugging log.

        if (influencerIds.length > 0) {
          console.log("Querying users collection with UIDs:", influencerIds); // Debugging log.
          const usersRef = collection(db, "users"); // Reference to the users collection.
          const influencersData = [];

          for (const uid of influencerIds) {
            const userDoc = doc(usersRef, uid); // Reference to the user document.
            const userSnapshot = await getDoc(userDoc); // Fetch the user document.

            if (userSnapshot.exists()) {
              influencersData.push({
                id: userSnapshot.id,
                uid: userSnapshot.id,
                ...userSnapshot.data(), // Add user data to the influencers list.
              });
            } else {
              console.warn(`User with UID ${uid} not found in users collection.`); // Log warning if user not found.
            }
          }

          console.log("Fetched influencers data:", influencersData); // Debugging log.
          setInfluencers(influencersData); // Update state with fetched influencers.
        } else {
          console.warn("No liked influencers found."); // Log warning if no influencers found.
          setInfluencers([]); // Set state to empty if no influencers found.
        }
      } catch (error) {
        console.error("Error fetching liked influencers:", error); // Log error if fetching fails.
      }
    };

    fetchLikedInfluencers();
  }, []);

  // useEffect to preselect an influencer based on query parameters.
  // This hook listens for changes in the URL query parameters and the list of influencers.
  // If an influencer ID is found in the URL, it preselects the corresponding influencer.
  useEffect(() => {
    const influencerId = new URLSearchParams(location.search).get("influencerId"); // Extract influencer ID from the URL.
    if (influencerId) {
      const preselectInfluencer = async () => {
        const influencer = influencers.find((inf) => inf.id === influencerId); // Find the influencer matching the ID.
        if (influencer) {
          await handleSelectInfluencer(influencer); // Select the influencer and fetch chat history.
        }
      };
      preselectInfluencer();
    }
  }, [location.search, influencers]);

  // Function to handle the selection of an influencer.
  // This function sets the selected influencer and fetches the chat history.
  const handleSelectInfluencer = async (influencer) => {
    if (!influencer.uid) {
      console.error("Selected influencer does not have a UID."); // Log error if UID is missing.
      return;
    }

    setSelectedInfluencer(influencer); // Update the state with the selected influencer.

    // Fetch chat history for the selected influencer
    const senderUID = auth.currentUser.uid; // Get the current user's UID.
    const receiverUID = influencer.uid; // Get the selected influencer's UID.
    const chatIdentifier = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Create a unique chat identifier.

    const chatCollectionRef = collection(db, "Messages", chatIdentifier, "messages"); // Reference to the chat messages collection.
    const chatQuery = query(chatCollectionRef, orderBy("timestamp", "asc")); // Query to fetch messages in ascending order of timestamp.

    const snapshot = await getDocs(chatQuery); // Fetch the chat messages.
    const messages = snapshot.docs.map((doc) => doc.data()); // Map the documents to message data.
    setChatHistory(messages); // Update the state with the fetched messages.
  };

  // useEffect to listen for real-time updates to the chat history.
  // This ensures that the chat panel is always up-to-date with the latest messages.
  useEffect(() => {
    if (selectedInfluencer) {
      const senderUID = auth.currentUser.uid; // Get the current user's UID.
      const receiverUID = selectedInfluencer.uid; // Get the selected influencer's UID.
      const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Create a unique chat identifier.

      const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.
      const q = query(chatRef, orderBy("timestamp", "asc")); // Query to fetch messages in ascending order of timestamp.

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          // Mark messages as read if they are sent to the current user
          if (data.receiverId === senderUID && !data.read) {
            const messageDocRef = doc(chatRef, docSnapshot.id); // Reference to the message document
            updateDoc(messageDocRef, { read: true }); // Mark the message as read
          }
          return data;
        });
        setChatHistory(messages); // Update the state with the fetched messages.
      });

      return () => unsubscribe(); // Cleanup the listener on component unmount.
    }
  }, [selectedInfluencer]);

  // Added functionality to send a message on pressing Enter
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Function to delete the chat history with the selected influencer.
  // Removes all messages in the chat from the database.
  const handleDeleteChat = async () => {
    if (selectedInfluencer) {
      try {
        const senderUID = auth.currentUser.uid; // Get the current user's UID.
        const receiverUID = selectedInfluencer.uid; // Get the selected influencer's UID.

        if (!receiverUID) {
          console.warn("Receiver UID is undefined. Cannot delete chat."); // Log warning if UID is missing.
          return;
        }

        const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Create a unique chat identifier.
        const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.

        const snapshot = await getDocs(chatRef); // Fetch the chat messages.

        if (snapshot.empty) {
          console.warn("No messages found for the selected chat."); // Log warning if no messages are found.
          return;
        }

        snapshot.forEach(async (doc) => {
          try {
            await deleteDoc(doc.ref); // Delete each message document.
          } catch (error) {
            console.error("Error deleting message document:", error); // Log error if deletion fails.
          }
        });

        setChatHistory([]); // Clear the chat history state.
      } catch (error) {
        console.error("Error fetching or deleting messages:", error); // Log error if fetching or deletion fails.
      }
    } else {
      console.warn("No influencer selected for chat deletion."); // Log warning if no influencer is selected.
    }
  };

  // Function to toggle the block status of the selected influencer.
  // Updates the block status in the database and UI.
  const handleToggleBlock = async () => {
    if (selectedInfluencer) {
      try {
        const senderUID = auth.currentUser.uid; // Get the current user's UID.
        const receiverUID = selectedInfluencer.uid; // Get the selected influencer's UID.

        if (!receiverUID) {
          console.warn("Receiver UID is undefined. Cannot toggle block status."); // Log warning if UID is missing.
          return;
        }

        const blockRef = doc(db, "Blocks", `${senderUID}_${receiverUID}`); // Reference to the block document.
        const reverseBlockRef = doc(db, "Blocks", `${receiverUID}_${senderUID}`); // Reference to the reverse block document.

        const blockDoc = await getDoc(blockRef); // Fetch the block document;
        if (isBlocked) {
          if (blockDoc.exists() && blockDoc.data().blockerId !== senderUID) {
            console.warn("Only the blocker can unblock this user."); // Log warning if the current user is not the blocker.
            return;
          }
          // Unblock the user
          await deleteDoc(blockRef);
          await deleteDoc(reverseBlockRef); // Remove reverse block as well
          console.log("User unblocked:", receiverUID);
        } else {
          // Block the user
          const blockData = {
            blockerId: senderUID,
            blockedId: receiverUID,
            timestamp: new Date(),
          };
          await setDoc(blockRef, blockData); // Create the block document.
          await setDoc(reverseBlockRef, blockData); // Create the reverse block document.
          console.log("User blocked:", receiverUID);
        }

        setIsBlocked((prev) => !prev); // Toggle the block status state.
      } catch (error) {
        console.error("Error toggling block status:", error); // Log error if toggling fails.
      }
    } else {
      console.warn("No influencer selected to toggle block status."); // Log warning if no influencer is selected.
    }
  };

  // Function to send a new message.
  // Adds the message to the Firestore database and clears the input field.
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedInfluencer) {
      const senderUID = auth.currentUser.uid; // Get the current user's UID.
      const receiverUID = selectedInfluencer?.uid; // Get the selected influencer's UID.

      if (!receiverUID) {
        console.error("Receiver UID is undefined. Cannot send message."); // Log error if UID is missing.
        return;
      }

      const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Create a unique chat identifier.

      const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.
      await addDoc(chatRef, {
        senderId: senderUID,
        receiverId: receiverUID,
        message: newMessage,
        timestamp: new Date(),
        read: false, // Mark the message as unread.
      });

      setNewMessage(""); // Clear the input field state.
    }
  };

  // useEffect to fetch the block status of the selected influencer.
  // Determines whether the influencer is blocked and updates the UI accordingly.
  useEffect(() => {
    if (selectedInfluencer) {
      const fetchBlockStatus = async () => {
        try {
          const senderUID = auth.currentUser.uid; // Get the current user's UID.
          const receiverUID = selectedInfluencer.uid; // Get the selected influencer's UID.

          if (!receiverUID) {
            console.warn("Receiver UID is undefined. Cannot fetch block status."); // Log warning if UID is missing.
            return;
          }

          const blockRef = doc(db, "Blocks", `${senderUID}_${receiverUID}`); // Reference to the block document.
          const blockDoc = await getDoc(blockRef); // Fetch the block document.

          if (blockDoc.exists()) {
            setIsBlocked(true); // Update the block status state.
          } else {
            setIsBlocked(false); // Update the block status state.
          }
        } catch (error) {
          console.error("Error fetching block status:", error); // Log error if fetching fails.
        }
      };

      fetchBlockStatus();
    }
  }, [selectedInfluencer]);

  // JSX structure for the BrandChats component.
  // The outermost Box sets the background and layout for the entire page.
  // It includes properties for background image, size, alignment, and padding.
  return (
    // Outer container: Sets the background and layout for the entire page.
    <Box
      sx={{
        backgroundImage: "url('/hero image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#F0F2F5",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box", // Ensures padding is included in the box size.
      }}
    >
      {/* Main container: Contains the entire chat interface */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: "0",
          border: "1px solid #ccc",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#ffffff",
          width: "100%",
          maxWidth: "1250px", // Limits the maximum width.
          height: "calc(100vh - 40px)", // Ensures it fits within the viewport.
        }}
      >
        {/* Left section: Displays the list of influencers. */}
        <Box
          sx={{
            flex: 1.5,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            borderRadius: "16px",
            height: "calc(100vh - 40px)",
            overflowY: "auto",
            border: "1px solid #ddd",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
            '@media (max-width: 600px)': {
              height: "auto",
              padding: "16px",
            },
          }}
        >
          {/* Header: Displays the title "Influencers". */}
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#333",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Influencers
          </Typography>
          {/* List: Contains individual influencer items. */}
          <List
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {influencers.map((influencer) => (
              // ListItem: Represents each influencer with an avatar and name.
              <ListItem
                key={influencer.id}
                button
                selected={selectedInfluencer?.id === influencer.id}
                onClick={() => handleSelectInfluencer(influencer)}
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "15px",
                  backgroundColor: selectedInfluencer?.id === influencer.id ? "#e0f7fa" : "#fff", // Highlights selected chat.
                  borderColor: selectedInfluencer?.id === influencer.id ? "#00796b" : "#ccc", // Changes border color for selected chat.
                  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  '&:hover': {
                    transform: "scale(1.02)",
                    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.15)",
                  },
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                {/* Influencer avatar: Displays the influencer's image. */}
                <img
                  src={decodeURIComponent(influencer.image || "/dp.png")}
                  alt="Influencer Avatar"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    border: "2px solid #ddd",
                    objectFit: "cover",
                  }}
                />
                {/* Influencer name and username. */}
                <ListItemText
                  primary={influencer.name}
                  secondary={influencer.username}
                  primaryTypographyProps={{
                    fontWeight: "bold",
                    color: "#333",
                  }}
                  secondaryTypographyProps={{
                    color: "#777",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        {/* Right section: Displays the chat panel. */}
        <Box
          sx={{
            flex: 3,
            display: "flex",
            flexDirection: "column",
            background: "#f0f2f5",
            borderRadius: "16px",
            height: "calc(100vh - 40px)",
            overflow: "hidden",
            boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)",
            '@media (max-width: 600px)': {
              height: "auto",
            },
          }}
        >
          {/* Header section: Displays the selected influencer's name and avatar. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 20px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #ddd",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Selected influencer details. */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {selectedInfluencer && (
                <img
                  src={selectedInfluencer?.image}
                  alt="User Avatar"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
              )}
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {selectedInfluencer?.name || "Select an Influencer"}
              </Typography>
            </Box>
            {/* Action buttons: Allow deleting the chat or toggling the block status. */}
            <Box sx={{ display: "flex", gap: "10px" }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteChat}
                disabled={!selectedInfluencer}
                sx={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                Delete Chat
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleToggleBlock}
                disabled={!selectedInfluencer}
                sx={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                {isBlocked ? "Unblock" : "Block"}
              </Button>
            </Box>
          </Box>
          {/* Chat area: Displays the chat history. */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              backgroundColor: isBlocked ? "#f8d7da" : "#e5ddd5",
            }}
          >
            {isBlocked ? (
              // Blocked message: Displays a message if the user is blocked.
              <Typography variant="h6" sx={{ color: "red", textAlign: "center" }}>
                You are blocked
              </Typography>
            ) : (
              chatHistory.map((chat, index) => (
                // Individual chat message.
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection:
                      chat.senderId === auth.currentUser.uid ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: "10px",
                  }}
                >
                  {chat.senderId !== auth.currentUser.uid && (
                    // Sender avatar: Displays the sender's image.
                    <img
                      src={selectedInfluencer?.image || logo}
                      alt="User Avatar"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  {/* Message box: Contains the message text and read status. */}
                  <Box
                    sx={{
                      backgroundColor:
                        chat.senderId === auth.currentUser.uid
                          ? "#dcf8c6"
                          : "#ffffff",
                      padding: "10px 15px",
                      borderRadius: "10px",
                      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                      maxWidth: "70%",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {chat.message}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: "#777",
                        textAlign: "right",
                        marginTop: "5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {chat.senderId === auth.currentUser.uid && (
                        <>
                          {chat.read ? (
                            <>
                              <span style={{ color: "#4caf50" }}>✔✔</span> {/* Double blue ticks for read */}
                            </>
                          ) : (
                            <>
                              <span style={{ color: "#777" }}>✔</span> {/* Single gray tick for unread */}
                            </>
                          )}
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
          {/* Input section: Allows sending new messages. */}
          {!isBlocked && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                backgroundColor: "#ffffff",
                borderTop: "1px solid #ddd",
              }}
            >
              {/* TextField: Input field for typing messages. */}
              <TextField
                fullWidth
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                sx={{
                  borderRadius: "20px",
                  backgroundColor: "#f0f0f0",
                  '& .MuiOutlinedInput-root': {
                    borderRadius: "20px",
                  },
                }}
              />
              {/* Button: Sends the message when clicked. */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={!selectedInfluencer}
                sx={{
                  minWidth: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  marginLeft: "10px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "20px", transform: "rotate(0deg)", color: "white" }}>
                  ➤
                </span>
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Export the BrandChats component for use in other parts of the application.
export default BrandChats;

// Function to handle the selection of an influencer.
// Fetches chat history and sets the selected influencer.
// Special handling for "Flumers Bot" to display a predefined chat history.

// useEffect to listen for real-time updates to the chat history.
// This ensures that the chat panel is always up-to-date with the latest messages.

// Function to delete the chat history with the selected influencer.
// Removes all messages in the chat from the database.

// Function to toggle the block status of the selected influencer.
// Updates the block status in the database and UI.

// Function to send a new message.
// Adds the message to the Firestore database and clears the input field.

// useEffect to fetch the block status of the selected influencer.
// Determines whether the influencer is blocked and updates the UI accordingly.

// JSX structure:
// - Outer container: Sets the background and layout for the entire page.
// - Left section: Displays the list of influencers.
//   - Typography: Header for the influencers list.
//   - List: Contains individual influencer items.
//     - ListItem: Represents each influencer with an avatar and name.
// - Right section: Displays the chat panel.
//   - Header: Shows the selected influencer's name and avatar.
//     - Buttons: Allow deleting the chat or toggling the block status.
//   - Chat area: Displays the chat history.
//     - Box: Represents individual chat messages with sender-specific styling.
//   - Input section: Allows sending new messages.
//     - TextField: Input field for typing messages.
//     - Button: Sends the message when clicked.