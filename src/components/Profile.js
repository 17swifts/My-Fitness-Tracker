// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Typography, CircularProgress } from '@mui/material';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setError('User profile not found');
          }
        } else {
          setError('No user is currently logged in');
        }
      } catch (error) {
        setError('Failed to fetch user profile');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      {userProfile ? (
        <div>
          <Typography variant="h6">Name: {userProfile.firstName} {userProfile.lastName}</Typography>
          <Typography variant="body1">Email: {userProfile.email}</Typography>
          <Typography variant="body1">Date of Birth: {userProfile.dob}</Typography>
          <Typography variant="body1">Mobile: {userProfile.mobile}</Typography>
          {userProfile.height && <Typography variant="body1">Height: {userProfile.height}</Typography>}
          {userProfile.weight && <Typography variant="body1">Weight: {userProfile.weight}</Typography>}
          {/* Display other profile information as needed */}
        </div>
      ) : (
        <Typography>No profile information available</Typography>
      )}
    </Box>
  );
};

export default Profile;
