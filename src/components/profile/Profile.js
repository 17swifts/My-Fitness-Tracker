import React, { useEffect, useReducer } from "react";
import { auth, firestore, storage } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AccountOptions from "./AccountOptions";
import ConnectOptions from "./ConnectOptions";

// Reducer for managing state
const profileReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER_PROFILE":
      return {
        ...state,
        userProfile: action.payload,
        avatar: action.payload.avatarUrl || null,
      };
    case "SET_WORKOUT_SUMMARY":
      return { ...state, workoutSummary: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_AVATAR":
      return { ...state, avatar: action.payload };
    default:
      return state;
  }
};

const Profile = () => {
  const navigate = useNavigate();

  // Manage state using useReducer
  const [state, dispatch] = useReducer(profileReducer, {
    userProfile: null,
    avatar: null,
    workoutSummary: { completedWorkouts: 0, cardioActivities: 0 },
    loading: true,
    error: null,
  });

  // Fetch User Profile & Workout Summary in Parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          dispatch({
            type: "SET_ERROR",
            payload: "No user is currently logged in",
          });
          return;
        }

        const userDocRef = doc(firestore, "users", user.uid);
        const workoutsRef = collection(firestore, "scheduledWorkouts");

        const [userDoc, workoutsSnapshot] = await Promise.all([
          getDoc(userDocRef),
          getDocs(
            query(
              workoutsRef,
              where("userId", "==", user.uid),
              where("isComplete", "==", true)
            )
          ),
        ]);

        if (userDoc.exists()) {
          dispatch({ type: "SET_USER_PROFILE", payload: userDoc.data() });
        } else {
          dispatch({ type: "SET_ERROR", payload: "User profile not found" });
          return;
        }

        let completedWorkouts = 0;
        let cardioActivities = 0;

        workoutsSnapshot.forEach((doc) => {
          completedWorkouts += 1;
          if (doc.data().type === "cardio") {
            cardioActivities += 1;
          }
        });

        dispatch({
          type: "SET_WORKOUT_SUMMARY",
          payload: { completedWorkouts, cardioActivities },
        });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to fetch profile data",
        });
        console.error(error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    fetchData();
  }, []);

  // Handle Avatar Change
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const storageRef = ref(storage, `avatars/${user.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        null,
        (error) => console.error("Avatar upload failed:", error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          dispatch({ type: "SET_AVATAR", payload: downloadURL });

          const userDocRef = doc(firestore, "users", user.uid);
          await updateDoc(userDocRef, { avatarUrl: downloadURL });
        }
      );
    } catch (error) {
      console.error("Avatar update error:", error);
    }
  };

  if (state.loading) return <CircularProgress />;
  if (state.error) return <Typography color="error">{state.error}</Typography>;

  return (
    <Box p={3} textAlign="center">
      {state.userProfile && (
        <>
          {/* Avatar Upload */}
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-upload">
            <Avatar
              src={state.avatar}
              alt="User Avatar"
              sx={{
                width: 100,
                height: 100,
                margin: "auto",
                cursor: "pointer",
              }}
            />
          </label>
          <Typography variant="h5" gutterBottom>
            {state.userProfile.firstName} {state.userProfile.lastName}
          </Typography>

          {/* Workout Summary */}
          <Box textAlign="left" mt={3} mb={3}>
            <Typography variant="h6">Summary</Typography>
            <Typography>
              Total Workouts Completed: {state.workoutSummary.completedWorkouts}
            </Typography>
            <Typography>
              Total Cardio Activities: {state.workoutSummary.cardioActivities}
            </Typography>
          </Box>

          <Divider />

          {/* My Account Options */}
          <AccountOptions navigate={navigate} />

          <Divider />

          {/* Connect Options */}
          <ConnectOptions navigate={navigate} />
        </>
      )}
    </Box>
  );
};

export default Profile;
