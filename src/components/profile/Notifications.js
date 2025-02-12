import React, { useEffect, useReducer } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { auth, firestore } from "../../firebase";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const notificationsReducer = (state, action) => {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "TOGGLE_NOTIFICATION":
      return {
        ...state,
        notifications: { ...state.notifications, [action.field]: action.value },
      };
    default:
      return state;
  }
};

const Notifications = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(notificationsReducer, {
    notifications: { email: false, push: false },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          dispatch({ type: "SET_ERROR", payload: "No user logged in" });
          return;
        }

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          dispatch({
            type: "SET_NOTIFICATIONS",
            payload: userDoc.data().notifications || {
              email: false,
              push: false,
            },
          });
        } else {
          dispatch({ type: "SET_ERROR", payload: "Notifications not found" });
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to fetch notifications",
        });
      }
    };

    fetchNotifications();
  }, []);

  // Handle Toggle & Update Firebase
  const handleToggle = async (e) => {
    const { name, checked } = e.target;
    dispatch({ type: "TOGGLE_NOTIFICATION", field: name, value: checked });

    try {
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        notifications: { ...state.notifications, [name]: checked },
      });
    } catch (error) {
      console.error("Failed to update notifications:", error);
    }
  };

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  return (
    <Box p={3} maxWidth={500} mx="auto">
      <IconButton className="back-button" onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" gutterBottom>
        Notification Settings
      </Typography>

      <Card elevation={3} sx={{ mt: 2, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manage Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={state.notifications.email}
                onChange={handleToggle}
                name="email"
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={state.notifications.push}
                onChange={handleToggle}
                name="push"
              />
            }
            label="Push Notifications"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Notifications;
