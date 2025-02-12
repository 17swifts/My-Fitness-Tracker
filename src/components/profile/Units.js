// src/components/Units.js
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../../firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Units = () => {
  const [units, setUnits] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUnits(userDoc.data().units || "metric");
          } else {
            setError("Units not found");
          }
        } else {
          setError("No user logged in");
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
        setError("Failed to fetch units");
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const handleChange = async (e) => {
    const selectedUnits = e.target.value;

    try {
      const userDocRef = doc(firestore, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { units: selectedUnits });
      setUnits(selectedUnits);
    } catch (error) {
      console.error("Failed to update units:", error);
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
        Units of Measurement
      </Typography>
      <RadioGroup value={units} onChange={handleChange}>
        <FormControlLabel
          value="metric"
          control={<Radio />}
          label="Metric (kg, cm)"
        />
        <FormControlLabel
          value="imperial"
          control={<Radio />}
          label="Imperial (lbs, inches)"
        />
      </RadioGroup>
    </Box>
  );
};

export default Units;
