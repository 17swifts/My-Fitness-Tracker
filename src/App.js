import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { CssBaseline, Container, AppBar, Toolbar, Typography, Button, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Dashboard, CalendarToday, FitnessCenter, BarChart, AccountCircle, Notifications } from '@mui/icons-material';

import SignUp from './components/SignUp';
import Profile from './components/Profile';
import CreateWorkoutPlan from './components/CreateWorkoutPlan';
import ExerciseLibrary from './components/ExerciseLibrary';
import LogWorkout from './components/LogWorkout';
import Statistics from './components/Statistics';
import DashboardPage from './components/DashboardPage';
import CalendarView from './components/CalendarView';
import WorkoutPlans from './components/WorkoutPlans';
import WorkoutPlanDetail from './components/WorkoutPlanDetail';
import ExerciseDetail from './components/ExerciseDetail';
import { auth } from './firebase';
import Units from './components/Units';
import UpdateProfile from './components/UpdateProfile';
import FitbitConnect from './components/FitbitConnect';

const App = () => {
  const [value, setValue] = React.useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    navigate('/signup');
  };

  const handleBottomNavChange = (event, newValue) => {
    setValue(newValue);
    if (user) {
      switch (newValue) {
        case 0:
          navigate('/dashboard');
          break;
        case 1:
          navigate('/calendar');
          break;
        case 2:
          navigate('/workout-plans');
          break;
        case 3:
          navigate('/statistics');
          break;
        case 4:
          navigate('/profile');
          break;
      }
    }
  };

  return (
    <div>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Fitness Tracker
          </Typography>
          {!user && (
            <Button color="inherit" onClick={() => navigate('/signup')}>
              Login
            </Button>
          )}
          {user && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container className="content-container">
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          {user ? (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/workout-plans" element={<WorkoutPlans />} />
              <Route path="/workout-plans/:id" element={<WorkoutPlanDetail />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/units" element={<Units />} />
              <Route path='/update-profile' element={<UpdateProfile />} />
              <Route path='/notifications' element={<Notifications />} />
              <Route path='/connect/fitbit' element={<FitbitConnect />} />
              <Route path="/create-workout-plan" element={<CreateWorkoutPlan />} />
              <Route path="/create-workout-plan/:id" element={<CreateWorkoutPlan />} />
              <Route path="/exercise-library" element={<ExerciseLibrary />} />
              <Route path="/exercise/:exerciseId" element={<ExerciseDetail/>} />
              <Route path="/log-workout/:id" element={<LogWorkout />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <Route path="/" element={<Navigate to="/signup" />} />
          )}
        </Routes>
      </Container>
      {user && (
        <BottomNavigation
          value={value}
          onChange={handleBottomNavChange}
          showLabels
          style={{ position: 'fixed', bottom: 0, width: '100%' }}
        >
          <BottomNavigationAction label="Dashboard" icon={<Dashboard />} />
          <BottomNavigationAction label="Calendar" icon={<CalendarToday />} />
          <BottomNavigationAction label="Workout Plans" icon={<FitnessCenter />} />
          <BottomNavigationAction label="Statistics" icon={<BarChart />} />
          <BottomNavigationAction label="Profile" icon={<AccountCircle />} />
        </BottomNavigation>
      )}
    </div>
  );
};

export default App;
