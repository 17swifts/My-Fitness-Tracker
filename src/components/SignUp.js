import React, { useState } from 'react';
import { auth, firestore, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { TextField, Button, Container, Typography, Link } from '@mui/material';
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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      if (isSigningUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(firestore, 'users', user.uid), {
          firstName,
          lastName,
          dob,
          mobile,
          height,
          weight,
          email: user.email,
          pwd: password,
        });
        console.log('User signed up and data saved to Firestore');
        navigate('/profile'); // Redirect to profile completion page
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in');
        navigate('/dashboard'); // Redirect to dashboard after login
      }

    } catch (error) {
      setError(error.message);
      console.error('Error signing up:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('User logged in with Google');
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (error) {
      setError(error.message);
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        {isSigningUp ? 'Sign Up' : 'Login'}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" />
      {isSigningUp && (
        <form onSubmit={handleSignUp}>
          <TextField fullWidth margin="normal" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField fullWidth margin="normal" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <TextField fullWidth margin="normal" label="Date of Birth" type="date" value={dob}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) => setDob(e.target.value)}
          />
          <TextField fullWidth margin="normal" label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <TextField fullWidth margin="normal" label="Height (optional)" value={height} onChange={(e) => setHeight(e.target.value)} />
          <TextField fullWidth margin="normal" label="Weight (optional)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Complete Sign Up
          </Button>
          <Button type="button" variant="contained" color="secondary" fullWidth onClick={handleGoogleSignIn} >
            Sign In with Google
          </Button>
        </form>
      )}
      {!isSigningUp &&
        <Button variant="contained" color="primary" onClick={handleSignUp}>
          Login
        </Button>
      }
      <Typography variant="body2" style={{ marginTop: '1rem' }}>
        {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link href="#" onClick={() => setIsSigningUp(!isSigningUp)}>
          {isSigningUp ? 'Login' : 'Sign Up'}
        </Link>
      </Typography>
    </Container>
  );
};

export default SignUp;
