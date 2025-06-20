// Importing React and necessary hooks for state management and lifecycle methods.
import React, { useState, useRef } from "react";

// Importing Material-UI components for UI elements like Box, TextField, Button, etc.
import { Box, TextField, Button, Typography } from "@mui/material";

// Importing Axios for making HTTP requests.
import axios from "axios";

// Importing the logo image for display purposes.
import logo from "../../logo.png";

// FloatingChatbot component provides a draggable chatbot interface.
// It includes functionality for toggling visibility, sending messages, and handling drag events.


const FloatingChatbot = () => {
  // State to track whether the chatbot is open or closed.
  const [isOpen, setIsOpen] = useState(false);

  // State to store the list of messages exchanged between the user and the bot.
  const [messages, setMessages] = useState([]);

  // State to store the new message typed by the user.
  const [newMessage, setNewMessage] = useState("");

  // Ref to track the chatbot's position for dragging functionality.
  const chatbotRef = useRef(null);

  // State to store the current position of the chatbot.
  const [position, setPosition] = useState({ x: 20, y: 20 });

  // State to track whether the chatbot is being dragged.
  const [dragging, setDragging] = useState(false);

  // Function to toggle the visibility of the chatbot.
  const toggleChatbox = () => {
    setIsOpen(!isOpen); // Toggle the isOpen state between true and false.
  };

  // Function to send a message to the chatbot.
  // It updates the message list and sends the message to the server.
  const sendMessage = async () => {
    if (newMessage.trim() === "") return; // Prevent sending empty messages.

    // Add the user's message to the message list.
    const userMessage = { sender: "user", content: newMessage };
    setMessages((prev) => [...prev, userMessage]); // Update the messages state.
    setNewMessage(""); // Clear the input field.

    try {
      // Send the message to the server and get the bot's reply.
      const response = await axios.post("http://localhost:8000/api/chatbot/chat/", { message: newMessage });
      const botMessage = { sender: "bot", content: response.data.reply };
      setMessages((prev) => [...prev, botMessage]); // Add the bot's reply to the messages.
    } catch (error) {
      console.error("Error sending message:", error); // Log the error.
      const errorMessage = { sender: "bot", content: "Sorry, I couldn't process your request." };
      setMessages((prev) => [...prev, errorMessage]); // Add an error message to the messages.
    }
  };

  // Function to handle the start of dragging.
  const handleMouseDown = (e) => {
    setDragging(true); // Set dragging state to true.
    chatbotRef.current.startX = e.clientX - position.x; // Calculate the initial X position.
    chatbotRef.current.startY = e.clientY - position.y; // Calculate the initial Y position.
    document.addEventListener("mousemove", handleMouseMove); // Add mousemove event listener.
    document.addEventListener("mouseup", handleMouseUp); // Add mouseup event listener.
  };

  // Function to handle the movement of the chatbot during dragging.
  const handleMouseMove = (e) => {
    if (!dragging) return; // Exit if dragging is false.
    setPosition({
      x: e.clientX - chatbotRef.current.startX, // Update X position.
      y: e.clientY - chatbotRef.current.startY, // Update Y position.
    });
  };

  // Function to handle the end of dragging.
  const handleMouseUp = () => {
    setDragging(false); // Set dragging state to false.
    document.removeEventListener("mousemove", handleMouseMove); // Remove mousemove event listener.
    document.removeEventListener("mouseup", handleMouseUp); // Remove mouseup event listener.
  };

  // JSX structure for the FloatingChatbot component.
  // The outermost Box sets the position and layout for the chatbot
  return (
    <Box
      ref={chatbotRef} // Attach the ref to the Box element for tracking position during dragging.
      onMouseDown={handleMouseDown} // Trigger handleMouseDown to initiate dragging.
      sx={{
        position: "fixed", // Ensures the chatbot stays fixed on the screen.
        left: "20px", // Positions the chatbot 20px from the left edge of the screen.
        bottom: "20px", // Positions the chatbot 20px from the bottom edge of the screen.
        zIndex: 1000, // Places the chatbot above other elements on the page.
        cursor: dragging ? "grabbing" : "grab", // Changes the cursor style based on dragging state.
        width: "100px", // Sets the width of the floating button.
        height: "100px", // Sets the height of the floating button.
      }}
    >
      {/* Floating Button */}
      {!isOpen && (
        <Button
          variant="contained" // Applies Material-UI's contained button style.
          color="primary" // Sets the button color to primary.
          onClick={toggleChatbox} // Toggles the visibility of the chatbot.
          sx={{
            width: "100px", // Matches the width of the floating button.
            height: "100px", // Matches the height of the floating button.
            borderRadius: "50%", // Makes the button circular.
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Adds a shadow for depth.
            padding: 0, // Removes padding inside the button.
            backgroundImage: "url('/hero image.jpg')", // Sets a background image for the button.
            backgroundSize: "cover", // Ensures the image covers the entire button.
            backgroundPosition: "center", // Centers the background image.
          }}
        >
          <img
            src={logo} // Displays the chatbot logo inside the button.
            alt="Chatbot Icon" // Provides an accessible description for the image.
            style={{ width: "100%", height: "100%", borderRadius: "50%" }} // Ensures the image fits the button and remains circular.
          />
        </Button>
      )}

      {/* Chatbox */}
      {isOpen && (
        <Box
          sx={{
            position: "absolute", // Ensures the chatbox opens relative to the floating button.
            bottom: "110px", // Positions the chatbox above the floating button.
            left: "0px", // Aligns the chatbox horizontally with the button.
            width: "300px", // Sets the width of the chatbox.
            height: "400px", // Sets the height of the chatbox.
            backgroundColor: "#fff", // Gives the chatbox a white background.
            borderRadius: "10px", // Rounds the corners of the chatbox.
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow for depth.
            display: "flex", // Uses flexbox for layout.
            flexDirection: "column", // Arranges child elements vertically.
            overflow: "hidden", // Prevents content from overflowing the chatbox.
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: "#1976d2", // Sets the header background to a blue color.
              color: "#fff", // Makes the text color white for contrast.
              padding: "10px", // Adds padding inside the header.
              display: "flex", // Uses flexbox for layout.
              justifyContent: "space-between", // Spaces out elements horizontally.
              alignItems: "center", // Aligns elements vertically in the center.
            }}
          >
            <Typography variant="h6">Chatbot</Typography> {/* Displays the chatbot title. */}
            <Button
              onClick={toggleChatbox} // Closes the chatbox when clicked.
              sx={{ color: "#fff", minWidth: "auto" }} // Styles the close button with white text and minimal width.
            >
              ✖ {/* Close icon. */}
            </Button>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1, // Allows the messages section to grow and fill available space.
              padding: "10px", // Adds padding inside the messages section.
              overflowY: "auto", // Enables vertical scrolling for long messages.
              display: "flex", // Uses flexbox for layout.
              flexDirection: "column", // Arranges messages vertically.
              gap: "10px", // Adds space between individual messages.
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index} // Provides a unique key for each message.
                sx={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", // Aligns messages based on sender.
                  backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#f0f0f0", // Sets background color based on sender.
                  padding: "10px", // Adds padding inside the message box.
                  borderRadius: "10px", // Rounds the corners of the message box.
                  maxWidth: "80%", // Limits the width of the message box.
                }}
              >
                <Typography>{msg.content}</Typography> {/* Displays the message content. */}
              </Box>
            ))}
          </Box>

          {/* Input */}
          <Box
            sx={{
              display: "flex", // Uses flexbox for layout.
              padding: "10px", // Adds padding inside the input section.
              borderTop: "1px solid #ddd", // Adds a border at the top of the input section.
            }}
          >
            <TextField
              fullWidth // Makes the input field take up the full width.
              value={newMessage} // Binds the input value to the newMessage state.
              onChange={(e) => setNewMessage(e.target.value)} // Updates the newMessage state on change.
              placeholder="Type a message..." // Sets placeholder text for the input field.
              onKeyPress={(e) => {
                if (e.key === "Enter") sendMessage(); // Sends the message when Enter is pressed.
              }}
            />
            <Button
              variant="contained" // Uses Material-UI contained button style.
              color="primary" // Sets the button color to primary.
              onClick={sendMessage} // Sends the message when clicked.
              sx={{ marginLeft: "10px" }} // Adds margin to the left of the button.
            >
              Send {/* Button text. */}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FloatingChatbot;
