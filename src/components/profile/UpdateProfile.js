import React, { useEffect, useReducer } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { auth, firestore } from "../../firebase";
import ProfileForm from "./ProfileForm";

const profileReducer = (state, action) => {
  switch (action.type) {
    case "SET_PROFILE_DATA":
      return { ...state, profileData: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "UPDATE_FIELD":
      return {
        ...state,
        profileData: { ...state.profileData, [action.field]: action.value },
      };
    default:
      return state;
  }
};

const UpdateProfile = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(profileReducer, {
    profileData: {
      firstName: "",
      lastName: "",
      dob: "",
      height: "",
      sex: "",
      activityLevel: "",
      country: "",
      city: "",
    },
    loading: true,
    error: null,
  });

  // Fetch User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          dispatch({ type: "SET_ERROR", payload: "No user logged in" });
          return;
        }

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          dispatch({ type: "SET_PROFILE_DATA", payload: userDoc.data() });
        } else {
          dispatch({ type: "SET_ERROR", payload: "Profile not found" });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to fetch profile" });
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, state.profileData);
      navigate("/profile"); // ✅ Navigate back to profile after update
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Update Profile
      </Typography>

      {/* Profile Form Component */}
      <ProfileForm
        profileData={state.profileData}
        dispatch={dispatch}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
};

export default UpdateProfile;
