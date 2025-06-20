// Importing React and necessary hooks for state management and lifecycle methods.
import React, { useState, useEffect } from "react";

// Importing Material-UI components for UI design.
import { Typography, Box, List, ListItem, ListItemText, TextField, Button } from "@mui/material";

// Importing Firebase configuration and methods for database operations.
import { db, auth } from "../../api/firebaseConfig";
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, documentId, deleteDoc, updateDoc, doc, setDoc, getDoc } from "firebase/firestore";

// Importing the logo image for display purposes.
import logo from "../../logo.png";

// InfluencerChats component provides a chat interface for influencers to communicate with brands.
const InfluencerChats = () => {
  // State variables:
  // - brands: Stores the list of brands available for chat.
  // - selectedBrand: Stores the currently selected brand for chat.
  // - chatHistory: Stores the chat messages exchanged with the selected brand.
  // - newMessage: Stores the new message typed by the user.
  // - isBlocked: Tracks whether the selected brand is blocked.
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  // useEffect hook to fetch brands and initialize the chat interface.
  useEffect(() => {
    const fetchBrands = async () => {
      const user = auth.currentUser; // Get the current authenticated user.
      if (user) {
        const brandsRef = collection(db, "users"); // Reference to the users collection.
        const q = query(brandsRef, where("role", "==", "brand")); // Query to fetch brands.
        const snapshot = await getDocs(q); // Execute the query.
        const data = snapshot.docs.map((doc) => ({ id: doc.id, uid: doc.id, ...doc.data() })); // Map the results.

        // Filter brands that have initiated chats with the influencer.
        const chatRef = collection(db, "Messages"); // Reference to the Messages collection.
        const chatSnapshot = await getDocs(chatRef); // Fetch chat data.
        const activeChats = chatSnapshot.docs
          .map((doc) => doc.id.split("_").find((id) => id !== user.uid)) // Extract active chat IDs.
          .filter((id) => id); // Filter valid IDs.

        const decodedBrands = data.map((brand) => ({
          ...brand,
          image: decodeURIComponent(brand.image || logo), // Decode brand image URL.
        }));

        const filteredBrands = decodedBrands.filter((brand) => activeChats.includes(brand.uid)); // Filter brands with active chats.

        setBrands(filteredBrands); // Only show real brands, not the bot
      }
    };

    fetchBrands(); // Call the function to fetch brands.
  }, []);

  // Function to handle brand selection.
  const handleSelectBrand = async (brand) => {
    setSelectedBrand(brand); // Update the selected brand state.
  };

  // Function to send a message.
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedBrand) {
      const senderUID = auth.currentUser.uid; // Get the sender's UID.
      const receiverUID = selectedBrand?.uid; // Get the receiver's UID.

      if (!receiverUID) {
        console.error("Receiver UID is undefined. Cannot send message.");
        return; // Exit the function.
      }

      const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Generate chat ID.

      const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.
      await addDoc(chatRef, {
        senderId: senderUID, // Sender's UID.
        receiverId: receiverUID, // Receiver's UID.
        message: newMessage, // Message content.
        timestamp: new Date(), // Timestamp of the message.
        read: false, // Explicitly set read to false.
      });

      setNewMessage(""); // Clear the input field.
    }
  };

  // Function to handle Enter key press for sending messages.
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default behavior.
      handleSendMessage(); // Call the send message function.
    }
  };

  // Function to delete a chat.
  const handleDeleteChat = async () => {
    if (selectedBrand) {
      try {
        const senderUID = auth.currentUser.uid; // Get the sender's UID.
        const receiverUID = selectedBrand.uid; // Get the receiver's UID.

        if (!receiverUID) {
          console.warn("Receiver UID is undefined. Cannot delete chat.");
          return; // Exit the function.
        }

        const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Generate chat ID.
        const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.

        const snapshot = await getDocs(chatRef); // Fetch chat messages.

        if (snapshot.empty) {
          console.warn("No messages found for the selected chat.");
          return; // Exit the function.
        }

        console.log("Deleting messages for chat ID:", chatId); // Log the chat ID.
        snapshot.forEach(async (doc) => {
          try {
            await deleteDoc(doc.ref); // Delete each message document.
            console.log("Deleted message document with ID:", doc.id); // Log the deleted document ID.
          } catch (error) {
            console.error("Error deleting message document:", error); // Log the error.
          }
        });

        setChatHistory([]); // Clear the chat history state.
      } catch (error) {
        console.error("Error fetching or deleting messages:", error); // Log the error.
      }
    } else {
      console.warn("No brand selected for chat deletion."); // Warn if no brand is selected.
    }
  };

  // Function to toggle block status for a brand.
  const handleToggleBlock = async () => {
    if (selectedBrand) {
      try {
        const senderUID = auth.currentUser.uid; // Get the sender's UID.
        const receiverUID = selectedBrand.uid; // Get the receiver's UID.

        if (!receiverUID) {
          console.warn("Receiver UID is undefined. Cannot toggle block status.");
          return; // Exit the function.
        }

        const blockRef = doc(db, "Blocks", `${senderUID}_${receiverUID}`); // Reference to the block document.
        const reverseBlockRef = doc(db, "Blocks", `${receiverUID}_${senderUID}`); // Reference to the reverse block document.

        const blockDoc = await getDoc(blockRef); // Fetch the block document.
        if (isBlocked) {
          if (blockDoc.exists() && blockDoc.data().blockerId !== senderUID) {
            console.warn("Only the blocker can unblock this user.");
            return; // Exit the function.
          }
          // Unblock the user.
          await deleteDoc(blockRef); // Delete the block document.
          await deleteDoc(reverseBlockRef); // Delete the reverse block document.
          console.log("User unblocked:", receiverUID); // Log the unblocked user.
        } else {
          // Block the user.
          const blockData = {
            blockerId: senderUID, // Blocker's UID.
            blockedId: receiverUID, // Blocked user's UID.
            timestamp: new Date(), // Timestamp of the block.
          };
          await setDoc(blockRef, blockData); // Create the block document.
          await setDoc(reverseBlockRef, blockData); // Create the reverse block document.
          console.log("User blocked:", receiverUID); // Log the blocked user.
        }

        setIsBlocked((prev) => !prev); // Toggle the isBlocked state.
      } catch (error) {
        console.error("Error toggling block status:", error); // Log the error.
      }
    } else {
      console.warn("No brand selected to toggle block status."); // Warn if no brand is selected.
    }
  };

  // useEffect hook to manage real-time chat updates and message read status.
  useEffect(() => {
    if (selectedBrand) {
      const senderUID = auth.currentUser.uid; // Get the sender's UID.
      const receiverUID = selectedBrand.uid; // Get the receiver's UID.
      const chatId = senderUID < receiverUID ? `${senderUID}_${receiverUID}` : `${receiverUID}_${senderUID}`; // Generate chat ID.

      const chatRef = collection(db, "Messages", chatId, "messages"); // Reference to the chat messages collection.
      const q = query(chatRef, orderBy("timestamp", "asc")); // Query to order messages by timestamp.

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          // Mark messages as read if they are sent to the current user
          if (data.receiverId === senderUID && !data.read) {
            const messageDocRef = doc(chatRef, docSnapshot.id); // Correctly create a document reference
            updateDoc(messageDocRef, { read: true }); // Use updateDoc to update the document
          }
          return data;
        });
        setChatHistory(messages); // Update the chat history state with the fetched messages.
      });

      return () => unsubscribe(); // Cleanup the subscription on component unmount.
    }
  }, [selectedBrand]);

  // useEffect hook to fetch liked brands for the current influencer.
  useEffect(() => {
    const fetchLikedBrands = async () => {
      const currentUser = auth.currentUser; // Get the current authenticated user.
      if (!currentUser) {
        console.error("No current user found.");
        return; // Exit the function.
      }

      const influencerUid = currentUser.uid;
      console.log("Current influencerUid:", influencerUid); // Debugging log

      try {
        const likedInfluencersRef = collection(db, "liked_influencers"); // Reference to the liked influencers collection.
        const q = query(
          likedInfluencersRef,
          where("influencerUid", "==", influencerUid),
          where("liked", "==", "liked")
        ); // Query to fetch liked influencers for the current user.
        const snapshot = await getDocs(q); // Execute the query.

        console.log("Liked influencers snapshot:", snapshot.docs); // Debugging log

        const brandIds = snapshot.docs.map((doc) => doc.data().brandUid); // Extract brand UIDs from the snapshot.
        console.log("Extracted brand UIDs:", brandIds); // Debugging log

        if (brandIds.length > 0) {
          console.log("Querying users collection with UIDs:", brandIds); // Debugging log
          const usersRef = collection(db, "users");
          
          const usersQuery = query(usersRef, where(documentId(), "in", brandIds)); // Query to fetch user documents by document ID.
          const usersSnapshot = await getDocs(usersQuery); // Execute the query.
          const brandsData = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data(),
          })); // Map the results to brand data.

          console.log("Fetched brands data:", brandsData); // Debugging log
          setBrands(brandsData); // Update the brands state with the fetched data.
        } else {
          console.warn("No liked brands found.");
          setBrands([]); // No liked brands
        }
      } catch (error) {
        console.error("Error fetching liked brands:", error); // Log the error.
      }
    };

    fetchLikedBrands(); // Call the function to fetch liked brands.
  }, []);

  // useEffect hook to fetch the block status of the selected brand.
  useEffect(() => {
    if (selectedBrand) {
      const fetchBlockStatus = async () => {
        try {
          const senderUID = auth.currentUser.uid; // Get the sender's UID.
          const receiverUID = selectedBrand.uid; // Get the receiver's UID.

          if (!receiverUID) {
            console.warn("Receiver UID is undefined. Cannot fetch block status.");
            return; // Exit the function.
          }

          const blockRef = doc(db, "Blocks", `${senderUID}_${receiverUID}`); // Reference to the block document.
          const blockDoc = await getDoc(blockRef); // Fetch the block document.

          if (blockDoc.exists()) {
            setIsBlocked(true); // Set isBlocked state to true if block document exists.
          } else {
            setIsBlocked(false); // Set isBlocked state to false if block document does not exist.
          }
        } catch (error) {
          console.error("Error fetching block status:", error); // Log the error.
        }
      };

      fetchBlockStatus(); // Call the function to fetch block status.
    }
  }, [selectedBrand]);

  return (
    <Box // Main outer container for the entire chat interface
      sx={{
        backgroundImage: "url('/hero image.jpg')", // Sets the background image for the main container.
        backgroundSize: "cover", // Ensures the background image covers the entire container.
        backgroundPosition: "center", // Centers the background image within the container.
        backgroundRepeat: "no-repeat", // Prevents the background image from repeating.
        backgroundColor: "#F0F2F5", // Sets a fallback background color.
        minHeight: "100vh", // Ensures the container takes up the full viewport height.
        display: "flex", // Uses flexbox for layout.
        justifyContent: "center", // Centers child elements horizontally.
        alignItems: "center", // Centers child elements vertically.
        padding: "20px", // Adds padding inside the container.
        boxSizing: "border-box", // Includes padding in the element's total width and height.
        overflow: "hidden", // Prevents scrolling within the container.
      }}
    >
      <Box // Container for the two main sections: brands list (left) and chat panel (right)
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
          maxWidth: "1250px", // Limit the maximum width
          height: "90%", // Adjust height to fit within the viewport
        }}
      >
        {/* Left Section: Brands List */}
        <Box // Brands list sidebar container
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
          <Typography // Title for the brands list section
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#333",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Brands
          </Typography>
          <List // List of all brands user can chat with
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {brands.map((brand) => (
              <ListItem // Each brand in the brands list
                key={brand.id}
                button
                selected={selectedBrand?.id === brand.id}
                onClick={() => handleSelectBrand(brand)}
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "15px",
                  backgroundColor: selectedBrand?.id === brand.id ? "#e0f7fa" : "#fff", // Highlight selected chat
                  borderColor: selectedBrand?.id === brand.id ? "#00796b" : "#ccc", // Change border color for selected chat
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
                <img // Brand avatar image
                  src={decodeURIComponent(brand.image || logo)}
                  alt="Brand Avatar"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    border: "2px solid #ddd",
                    objectFit: "cover",
                  }}
                />
                <ListItemText // Brand name text
                  primary={brand.name}
                  primaryTypographyProps={{
                    fontWeight: "bold",
                    color: "#333",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Right Section: Chat Panel */}
        <Box // Main chat panel (right side)
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
          {/* Header Section */}
          <Box // Header of the chat panel (shows selected brand and action buttons)
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 20px",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #ddd",
            }}
          >
            <Box // Container for selected brand avatar and name
              sx={{ display: "flex", alignItems: "center" }}
            >
              {selectedBrand && (
                <img // Selected brand avatar in header
                  src={decodeURIComponent(selectedBrand?.image || logo)}
                  alt="User Avatar"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
              )}
              <Typography // Selected brand name in header
                variant="h6"
                sx={{ fontWeight: "bold" }}
              >
                {selectedBrand?.name || "Select a Brand"}
              </Typography>
            </Box>
            <Box // Container for Delete and Block/Unblock buttons
              sx={{ display: "flex", gap: "10px" }}
            >
              <Button // Delete Chat button
                variant="outlined"
                color="error"
                onClick={handleDeleteChat}
                disabled={!selectedBrand}
                sx={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                Delete Chat
              </Button>
              <Button // Block/Unblock button
                variant="outlined"
                color="warning"
                onClick={handleToggleBlock}
                disabled={!selectedBrand}
                sx={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                {isBlocked ? "Unblock" : "Block"}
              </Button>
            </Box>
          </Box>

          {/* Chat Area */}
          <Box // Main chat messages area
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
              <Typography // Blocked message
                variant="h6"
                sx={{ color: "red", textAlign: "center" }}
              >
                You are blocked
              </Typography>
            ) : (
              chatHistory.map((chat, index) => (
                <Box // Each chat message row
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: chat.senderId === auth.currentUser.uid ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: "10px",
                  }}
                >
                  {chat.senderId !== auth.currentUser.uid && (
                    <img // Avatar for the sender (if not current user)
                      src={selectedBrand?.image || logo}
                      alt="User Avatar"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                  <Box // Message bubble
                    sx={{
                      backgroundColor:
                        chat.senderId === auth.currentUser.uid ? "#dcf8c6" : "#ffffff",
                      padding: "10px 15px",
                      borderRadius: "10px",
                      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                      maxWidth: "70%",
                    }}
                  >
                    <Typography // Message text
                      sx={{
                        fontSize: "0.9rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {chat.message}
                    </Typography>
                    <Typography // Message status (read/unread ticks)
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

          {/* Input Section */}
          <Box // Container for message input and send button
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #ddd",
            }}
          >
            <TextField // Input field for typing a new message
              fullWidth
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={handleKeyPress}
              sx={{
                borderRadius: "20px",
                backgroundColor: "#f0f0f0",
                '& .MuiOutlinedInput-root': {
                  borderRadius: "20px",
                },
              }}
            />
            <Button // Send message button
              variant="contained" // Applies Material-UI's contained button style.
              color="primary" // Sets the button color to primary.
              onClick={handleSendMessage} // Sends the message when clicked.
              disabled={!selectedBrand} // Disables the button if no brand is selected.
              sx={{
                minWidth: "50px", // Sets the minimum width of the button.
                height: "50px", // Sets the height of the button.
                borderRadius: "50%", // Makes the button circular.
                marginLeft: "10px", // Adds margin to the left of the button.
                display: "flex", // Uses flexbox for layout.
                justifyContent: "center", // Centers the content horizontally.
                alignItems: "center", // Centers the content vertically.
              }}
            >
              <span
                style={{
                  fontSize: "20px", // Sets the font size of the arrow icon.
                  transform: "rotate(0deg)", // Ensures the arrow icon is not rotated.
                  color: "white", // Sets the color of the arrow icon to white.
                }}
              >
                ➤ {/* Arrow icon for sending messages. */}
              </span>
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default InfluencerChats;