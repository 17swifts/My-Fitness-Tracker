// src/components/FitbitConnect.js
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import axios from 'axios';

const FitbitConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const clientId = 'YOUR_FITBIT_CLIENT_ID';
  const redirectUri = 'YOUR_REDIRECT_URI';
  const clientSecret = 'YOUR_FITBIT_CLIENT_SECRET';

  const handleConnect = () => {
    const fitbitAuthUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=activity%20heartrate`;
    window.location.href = fitbitAuthUrl;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
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
        .then(response => {
          setAccessToken(response.data.access_token);
          setIsConnected(true);
        })
        .catch(error => {
          console.error('Error fetching Fitbit access token:', error);
        });
    }
  }, [clientId, clientSecret, redirectUri]);

  const handleSync = () => {
    if (accessToken) {
      // Example of retrieving step count and heart rate
      axios
        .get('https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then(response => {
          console.log('Step count:', response.data);
        })
        .catch(error => {
          console.error('Error fetching step count:', error);
        });

      axios
        .get('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then(response => {
          console.log('Heart rate:', response.data);
        })
        .catch(error => {
          console.error('Error fetching heart rate:', error);
        });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccessToken(null);
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
        </Box>
      )}
    </Box>
  );
};

export default FitbitConnect;
