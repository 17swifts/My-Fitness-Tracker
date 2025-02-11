// src/components/UpdateProfile.js
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const UpdateProfile = () => {
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    height: "",
    sex: "",
    activityLevel: "",
    country: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfileData(userDoc.data());
          } else {
            setError("Profile not found");
          }
        } else {
          setError("No user logged in");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, profileData);
      navigate("/profile"); // Navigate back to profile after update
    } catch (error) {
      console.error("Failed to update profile:", error);
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
        Update Profile
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="First Name"
          name="firstName"
          value={profileData.firstName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={profileData.lastName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Date of Birth"
          name="dob"
          type="date"
          value={profileData.dob}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Height (cm)"
          name="height"
          value={profileData.height}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Sex"
          name="sex"
          select
          value={profileData.sex}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="male">Male</MenuItem>
          <MenuItem value="female">Female</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
        <TextField
          label="Activity Level"
          name="activityLevel"
          select
          value={profileData.activityLevel}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="sedentary">Sedentary</MenuItem>
          <MenuItem value="light">Lightly Active</MenuItem>
          <MenuItem value="moderate">Moderately Active</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="veryActive">Very Active</MenuItem>
        </TextField>
        <TextField
          label="Country"
          name="country"
          value={profileData.country}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="City"
          name="city"
          value={profileData.city}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Save Changes
        </Button>
      </form>
    </Box>
  );
};

export default UpdateProfile;
