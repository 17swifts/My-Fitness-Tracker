import React, { useState, useEffect } from "react";
import { auth, firestore, storage } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Avatar,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Divider,
  IconButton,
  ListItemIcon,
} from "@mui/material";
import { AccountCircle, Notifications, Fitbit } from "@mui/icons-material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [workoutSummary, setWorkoutSummary] = useState({
    completedWorkouts: 0,
    cardioActivities: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
            setAvatar(userDoc.data().avatarUrl || null);
            fetchWorkoutSummary(user.uid);
          } else {
            setError("User profile not found");
          }
        } else {
          setError("No user is currently logged in");
        }
      } catch (error) {
        setError("Failed to fetch user profile");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWorkoutSummary = async (userId) => {
      try {
        const workoutsRef = collection(firestore, "scheduledWorkouts");
        const q = query(
          workoutsRef,
          where("userId", "==", userId),
          where("isComplete", "==", true)
        );
        const querySnapshot = await getDocs(q);

        let completedWorkouts = 0;
        let cardioActivities = 0;

        querySnapshot.forEach((doc) => {
          completedWorkouts += 1;
          if (doc.data().type === "cardio") {
            cardioActivities += 1;
          }
        });

        setWorkoutSummary({ completedWorkouts, cardioActivities });
      } catch (error) {
        console.error("Failed to fetch workout summary:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        () => {},
        (error) => {
          console.error("Avatar upload failed:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setAvatar(downloadURL);
          const userDocRef = doc(firestore, "users", auth.currentUser.uid);
          await userDocRef.update({ avatarUrl: downloadURL });
        }
      );
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box p={3} textAlign="center">
      <IconButton className="back-button" onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>
      {userProfile && (
        <>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload"
            type="file"
            onChange={handleAvatarChange}
          />
          <label htmlFor="avatar-upload">
            <Avatar
              src={avatar}
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
            {userProfile.firstName} {userProfile.lastName}
          </Typography>

          <Box textAlign="left" mt={3} mb={3}>
            <Typography variant="h6">Summary</Typography>
            <Typography>
              Total Workouts Completed: {workoutSummary.completedWorkouts}
            </Typography>
            <Typography>
              Total Cardio Activities: {workoutSummary.cardioActivities}
            </Typography>
          </Box>

          <Divider />

          <Box mt={3} mb={3} textAlign="left">
            <Typography variant="h6" gutterBottom>
              My Account
            </Typography>
            <List>
              <ListItem button onClick={() => navigate("/update-profile")}>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                My Profile
              </ListItem>
              <ListItem button onClick={() => navigate("/notifications")}>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                Notifications
              </ListItem>
              <ListItem button onClick={() => navigate("/units")}>
                <ListItemIcon>
                  <AnalyticsIcon />
                </ListItemIcon>
                Units
              </ListItem>
            </List>
          </Box>

          <Divider />

          <Box mt={3} textAlign="left">
            <Typography variant="h6" gutterBottom>
              Connect
            </Typography>
            <List>
              <ListItem button onClick={() => navigate("/connect/fitbit")}>
                <ListItemIcon>
                  <Fitbit />
                </ListItemIcon>
                Fitbit
              </ListItem>
              <ListItem
                button
                onClick={() => navigate("/connect/myfitnesspal")}
              >
                MyFitnessPal
              </ListItem>
              <ListItem button onClick={() => navigate("/connect/garmin")}>
                Garmin
              </ListItem>
              <ListItem button onClick={() => navigate("/connect/inbody")}>
                InBody
              </ListItem>
            </List>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Profile;
