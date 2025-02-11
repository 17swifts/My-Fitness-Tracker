// src/components/Notifications.js
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Notifications = () => {
  const [notifications, setNotifications] = useState({
    email: false,
    push: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setNotifications(userDoc.data().notifications || {});
          } else {
            setError("Notifications not found");
          }
        } else {
          setError("No user logged in");
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setError("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleToggle = async (e) => {
    const { name, checked } = e.target;
    const updatedNotifications = { ...notifications, [name]: checked };

    try {
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { notifications: updatedNotifications });
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Failed to update notifications:", error);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box p={3}>
      <IconButton className="back-button" onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" gutterBottom>
        Notifications
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={notifications.email}
            onChange={handleToggle}
            name="email"
          />
        }
        label="Email Notifications"
      />
      <FormControlLabel
        control={
          <Switch
            checked={notifications.push}
            onChange={handleToggle}
            name="push"
          />
        }
        label="Push Notifications"
      />
    </Box>
  );
};

export default Notifications;
