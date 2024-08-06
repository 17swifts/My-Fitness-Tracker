// src/components/Timer.js
import React, { useState, useEffect } from 'react';

const Timer = ({ initialSeconds }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Timer: {seconds}s</h2>
    </div>
  );
};

export default Timer;
