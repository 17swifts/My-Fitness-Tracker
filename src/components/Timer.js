import React, { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, Select, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const TimerComponent = ({ onClose }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  useEffect(() => {
    let timer;
    if (timerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(timer);
      setTimerRunning(false);
      setSelectedTime(null);
      setTimerFinished(true);
      alert('Timer finished!');
      onClose(); // Hide the timer when it finishes
    }

    return () => clearInterval(timer);
  }, [timerRunning, countdown, onClose]);

  const handleTimeSelect = (event) => {
    setSelectedTime(event.target.value);
    setCountdown(event.target.value);
    setTimerRunning(true);
  };

  return (
    <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: '#f5f5f5', boxShadow: 2 }}>
      {!timerRunning && (
        <Select
          value={countdown || ''}
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

export default TimerComponent;
