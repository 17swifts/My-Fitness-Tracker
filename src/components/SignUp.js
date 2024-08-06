import React, { useState } from 'react';
import { auth, firestore, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { TextField, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      
      await setDoc(doc(firestore, 'users', user.uid), {
        firstName,
        lastName,
        dob,
        mobile,
        height,
        weight,
        email: user.email,
      });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User signed up and data saved to Firestore');
      navigate('/profile'); // Redirect to profile completion page
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in');
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('User logged in with Google');
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        {isRegistered ? 'Complete Profile' : 'Sign Up / Login'}
      </Typography>
      {!isSigningUp && !isRegistered && (
        <div>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => setIsSigningUp(true)}
            >
              Sign Up
            </Button>
          </form>
          <Button
            type="button"
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleGoogleSignIn}
          >
            Sign In with Google
          </Button>
        </div>
      )}
      {isSigningUp && !isRegistered && (
        <form onSubmit={handleSignUp}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Continue
          </Button>
        </form>
      )}
      {isRegistered && (
        <form onSubmit={handleSignUp}>
          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Date of Birth"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Height (optional)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Weight (optional)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Complete Sign Up
          </Button>
        </form>
      )}
    </Container>
  );
};

export default SignUp;
