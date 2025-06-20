import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6EC7", // Pinkish gradient start
    },
    secondary: {
      main: "#4A90E2", // Bluish gradient end
    },
    background: {
      default: "linear-gradient(135deg, #FF6EC7 0%, #4A90E2 100%)", // Gradient background
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#333333",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#333333",
    },
    body1: {
      fontSize: "1rem",
      color: "#555555",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          textTransform: "none",
          padding: "10px 20px",
          background: "linear-gradient(135deg, #FF6EC7 0%, #4A90E2 100%)",
          color: "#ffffff",
          '&:hover': {
            background: "linear-gradient(135deg, #FF6EC7 0%, #4A90E2 100%)",
            opacity: 0.9,
          },
        },
      },
    },
  },
});

export const lightTheme = theme;
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4267B2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E1306C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#18191A', // Dark Background
      paper: '#242526',
    },
    text: {
      primary: '#E4E6EB', // Light Text
      secondary: '#B0B3B8', // Gray Text
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#E4E6EB',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#E4E6EB',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#365899',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;