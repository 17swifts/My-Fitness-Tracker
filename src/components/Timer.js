import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, MenuItem, Select, Snackbar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Timer = ({ onClose }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const intervalRef = useRef(null);  // Store the interval ID

  useEffect(() => {
    if (timerRunning && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);
    }

    // Clear the interval when the timer stops or component unmounts
    return () => clearInterval(intervalRef.current);
  }, [timerRunning, countdown]);

  useEffect(() => {
    if (countdown === 0 && timerRunning) {
      clearInterval(intervalRef.current);
      setTimerRunning(false);
      setSelectedTime(null);
      setTimerFinished(true);
      onClose(); // Hide the timer when it finishes
    }
  }, [countdown, timerRunning, onClose]);

  const handleTimeSelect = (event) => {
    setSelectedTime(event.target.value);
    setCountdown(event.target.value);
    setTimerRunning(true);
  };

  return (
    <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: '#f5f5f5', boxShadow: 2 }}>
      {!timerRunning && (
        <Select
          value={selectedTime || ''}
          displayEmpty
          onChange={handleTimeSelect}
          sx={{ width: 120, mr: 2 }}
        >
          <MenuItem value="" disabled>
            Set Timer
          </MenuItem>
          {[...Array(12)].map((_, i) => (
            <MenuItem key={i} value={(i + 1) * 5}>
              {(i + 1) * 5}s
            </MenuItem>
          ))}
          {[...Array(8)].map((_, i) => (
            <MenuItem key={i + 12} value={60 + i * 30}>
              {1 + i / 2}m
            </MenuItem>
          ))}
        </Select>
      )}
      {timerRunning && (
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Time Left: {Math.floor(countdown / 60)}:{countdown % 60 < 10 ? `0${countdown % 60}` : countdown % 60}s
        </Typography>
      )}
      <Snackbar
        open={timerFinished}
        autoHideDuration={6000}
        message="Timer Finished"
        action={
          <IconButton size="small" color="inherit" onClick={() => setTimerFinished(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default Timer;
