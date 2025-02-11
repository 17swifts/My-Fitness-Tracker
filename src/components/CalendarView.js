import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { auth, firestore } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import PoolIcon from "@mui/icons-material/Pool";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import dayjs from "dayjs";
import axios from "axios";
import "./styles/CalendarView.css";
import { useFitbit } from "../context/FitbitContext.js";

const CalendarView = () => {
  const { fitbitToken } = useFitbit();
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [workoutNames, setWorkoutNames] = useState({});
  const [activities, setActivities] = useState({});
  const [dates, setDates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduledWorkouts = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(firestore, "scheduledWorkouts"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const workouts = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setScheduledWorkouts(workouts);

          const workoutIds = [
            ...new Set(workouts.map((workout) => workout.workoutId)),
          ];
          const names = {};
          for (const workoutId of workoutIds) {
            const docRef = doc(firestore, "workoutPlans", workoutId);
            const workoutDoc = await getDoc(docRef);
            if (workoutDoc.exists()) {
              names[workoutId] = workoutDoc.data().name;
            }
          }
          setWorkoutNames(names);
        }
      } catch (error) {
        console.error("Error fetching scheduled workouts:", error);
      }
    };

    const generateTwoWeeksDates = () => {
      const today = dayjs();
      const datesArray = [];

      for (let i = 7; i >= 0; i--) {
        datesArray.push(today.subtract(i, "day").format("YYYY-MM-DD"));
      }
      for (let i = 1; i < 15; i++) {
        datesArray.push(today.add(i, "day").format("YYYY-MM-DD"));
      }

      setDates(datesArray);
    };

    fetchScheduledWorkouts();
    generateTwoWeeksDates();
  }, [fitbitToken]);

  useEffect(() => {
    const fetchFitbitActivities = async () => {
      if (fitbitToken) {
        try {
          const pastDates = dates.filter((date) =>
            dayjs(date).isBefore(dayjs(), "day")
          ); // Filter past dates
          const dateRequests = pastDates.map((date) =>
            axios.get(
              `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
              {
                headers: { Authorization: `Bearer ${fitbitToken}` },
              }
            )
          );

          const responses = await Promise.all(dateRequests);
          const activitiesData = responses.reduce((acc, response) => {
            const date = response.data.activities[0]?.startDate;
            const fitbitActivities = response.data.activities || [];
            if (date) {
              acc[date] = fitbitActivities.map((activity) => ({
                type: "exercise",
                name: activity.name,
                isComplete: true,
                calories: activity.calories,
                distance: activity.distance ? activity.distance : 0,
                steps: activity.steps,
                duration: activity.duration,
                exerciseType: activity.activityParentName,
              }));
            }
            return acc;
          }, {});

          setActivities(activitiesData);
        } catch (error) {
          console.error("Error fetching Fitbit activities:", error);
        }
      }
    };

    if (dates.length > 0) {
      fetchFitbitActivities();
    }
  }, [dates, fitbitToken]);

  const handleWorkoutClick = (workoutId) => {
    navigate(`/workout-plans/${workoutId}`);
  };

  const formatActivitySecondaryText = (activity) => {
    const { type, distance, steps, duration, calories } = activity;

    if (type === "exercise") {
      // Format distance and steps
      let distanceOrSteps =
        distance > 0 ? `${distance.toFixed(2)} km` : `${steps} steps`;

      // Format duration
      let formattedDuration = "";
      if (duration < 3600000) {
        // Less than an hour
        formattedDuration = `${Math.floor(duration / 60000)}m ${String(
          Math.floor((duration % 60000) / 1000)
        ).padStart(2, "0")}s`;
      } else {
        // More than an hour
        formattedDuration = `${Math.floor(duration / 3600000)}hr ${Math.floor(
          (duration % 3600000) / 60000
        )} mins`;
      }

      return `${distanceOrSteps} | ${formattedDuration}`;
    }

    if (type === "meal") {
      // Format calories for meal activity
      return `Calories: ${calories}`;
    }

    // Default fallback if activity type is not exercise or meal
    return "No additional information available";
  };

  const renderActivities = (date) => {
    const dateActivities = activities[date] || [];
    return dateActivities.map((activity, index) => (
      <ListItem className="list-item" key={index}>
        <ListItemIcon
          className={`${
            activity.isComplete ? "completed-icon" : "incomplete-icon"
          }`}
        >
          {activity.isComplete ? (
            <CheckCircleIcon color="success" />
          ) : (
            <RadioButtonUncheckedIcon />
          )}
        </ListItemIcon>
        <ListItemText
          className="list-item-text"
          primary={activity.name}
          secondary={formatActivitySecondaryText(activity)}
          secondaryTypographyProps={{ className: "list-item-text-secondary" }}
        />
        {activity.type === "exercise" && activity.exerciseType === "Walk" && (
          <DirectionsWalkIcon className="activity-icon" />
        )}
        {activity.type === "exercise" && activity.exerciseType === "Swim" && (
          <PoolIcon className="activity-icon" />
        )}
        {activity.type === "exercise" && activity.exerciseType === "Run" && (
          <DirectionsRunIcon className="activity-icon" />
        )}
        {activity.type === "meals" && (
          <RestaurantIcon className="activity-icon" />
        )}
      </ListItem>
    ));
  };

  const renderWorkoutForDate = (date) => {
    const workoutsForDate = scheduledWorkouts.filter(
      (workout) => workout.date === date
    );
    if (workoutsForDate.length > 0) {
      return workoutsForDate.map((workout) => (
        <ListItem
          className="list-item"
          key={`${workout.id}-${date}`}
          button
          onClick={() => handleWorkoutClick(workout.id)}
        >
          <ListItemIcon
            className={`${
              workout.isComplete ? "completed-icon" : "incomplete-icon"
            }`}
          >
            {workout.isComplete ? (
              <CheckCircleIcon color="success" />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              workoutNames[workout.workoutId] ||
              `Workout ID: ${workout.workoutId}`
            }
            secondary={workout.isComplete ? "Completed" : "Incomplete"}
            className="list-item-text"
            secondaryTypographyProps={{ className: "list-item-text-secondary" }}
          />
          <FitnessCenterIcon className="activity-icon" />
          <MoreVertIcon></MoreVertIcon>
        </ListItem>
      ));
    } else {
      return (
        <ListItem className="list-item">
          <ListItemText
            className="list-item-text-secondary"
            primary="No workouts scheduled"
          />
          <MoreVertIcon></MoreVertIcon>
        </ListItem>
      );
    }
  };

  return (
    <Box className="calendar-container">
      <Typography className="calendar-heading" variant="h4" gutterBottom>
        Calendar
      </Typography>
      <List>
        {dates.map((date) => (
          <Box key={date} className="mb-3">
            <Typography className="date-header">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Typography>
            {renderWorkoutForDate(date)}
            {renderActivities(date)}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default CalendarView;
