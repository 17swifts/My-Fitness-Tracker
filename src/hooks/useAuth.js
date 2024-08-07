// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { auth } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return { user };
};
