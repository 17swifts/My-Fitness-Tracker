import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Alert } from '@mui/material';
import { auth, firestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import dayjs from 'dayjs';
import { useFitbit } from '../context/FitbitContext.js';

const FitbitConnect = () => {
  const { fitbitToken, setFitbitToken } = useFitbit();
  const [isConnected, setIsConnected] = useState(!!fitbitToken);
  const [isSynced, setIsSynced] = useState(false);

  const clientId = '23PLPV';
  const redirectUri = 'http://localhost:3000/connect/fitbit';
  const clientSecret = '2230c0aa7f8617ff589361ef02e8a380';

  const handleConnect = () => {
    const fitbitAuthUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=activity%20heartrate%20nutrition%20sleep%20location%20profile%20weight`;
    window.location.href = fitbitAuthUrl;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !fitbitToken) {
      axios
        .post('https://api.fitbit.com/oauth2/token', null, {
          params: {
            client_id: clientId,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code,
          },
          auth: {
            username: clientId,
            password: clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        .then(async (response) => {
          const token = response.data.access_token;
          setFitbitToken(token);
          setIsConnected(true);

          // Save token to Firestore immediately after retrieving it
          const user = auth.currentUser;
          if (user && token) {
            try {
              await setDoc(doc(firestore, 'users', user.uid), { fitbitToken: token }, { merge: true });
              console.log('Fitbit token saved successfully');
            } catch (error) {
              console.error('Error saving Fitbit token:', error);
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching Fitbit access token:', error);
        });
    }
  }, [clientId, clientSecret, redirectUri, fitbitToken, setFitbitToken]);

  const handleSync = () => {
    if (fitbitToken) {
      axios
        .get('https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json', {
          headers: {
            Authorization: `Bearer ${fitbitToken}`,
          },
        })
        .then((response) => {
          console.log('Step count:', response.data);
          setIsSynced(true);
        })
        .catch((error) => {
          console.error('Error fetching step count:', error);
        });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setFitbitToken(null);
    setIsSynced(false);
  };

  return (
    <Box>
      {!isConnected ? (
        <Button variant="contained" color="primary" onClick={handleConnect}>
          Connect Fitbit
        </Button>
      ) : (
        <Box>
          <Typography>You are connected to Fitbit.</Typography>
          <Button variant="contained" color="primary" onClick={handleSync}>
            Sync Fitbit Data
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleDisconnect}>
            Disconnect Fitbit
          </Button>
          {isSynced && (
            <Alert severity="success" sx={{ marginTop: 2 }}>
              Successfully synced Fitbit {dayjs().format('YYYY-MM-DD')}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FitbitConnect;
