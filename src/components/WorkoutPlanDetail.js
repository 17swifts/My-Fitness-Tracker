import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Link,
  Modal,
  ListItemIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { firestore } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Equipment from "./common/Equipment";
import ScheduleWorkout from "./calendar/ScheduleWorkout";
import "./styles/WorkoutPlanDetail.css";

const WorkoutPlanDetail = () => {
  const { id } = useParams();
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [isScheduledWorkout, setIsScheduledWorkout] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        // Try to fetch from scheduledWorkouts first
        const scheduledRef = doc(firestore, "scheduledWorkouts", id);
        const scheduledSnap = await getDoc(scheduledRef);

        if (scheduledSnap.exists()) {
          const scheduledData = {
            id: scheduledSnap.id,
            ...scheduledSnap.data(),
          };
          setWorkoutPlan(scheduledData);
          setIsScheduledWorkout(true);
          setIsCompleted(scheduledData.isCompleted || false); // Set initial completed state
          fetchWorkoutPlan(scheduledData.workoutId); // Fetch the actual workout details
        } else {
          // If not found in scheduledWorkouts, fetch from workoutPlans
          fetchWorkoutPlan(id);
        }
      } catch (error) {
        console.error("Error fetching workout data:", error);
      }
    };

    const fetchWorkoutPlan = async (workoutId) => {
      try {
        const docRef = doc(firestore, "workoutPlans", workoutId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const planData = { id: docSnap.id, ...docSnap.data() };
          setWorkoutPlan(planData);
          fetchExerciseDetails(planData);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching workout plan:", error);
      }
    };

    const fetchExerciseDetails = async (planData) => {
      try {
        const exerciseIds = new Set();
        planData.setGroups.forEach((group) => {
          group.sets.forEach((set) => {
            exerciseIds.add(set.exerciseId);
          });
        });

        const exercisePromises = Array.from(exerciseIds).map(
          async (exerciseId) => {
            const exerciseDoc = await getDoc(
              doc(firestore, "exercises", exerciseId)
            );
            return { id: exerciseId, data: exerciseDoc.data() };
          }
        );

        const exerciseResults = await Promise.all(exercisePromises);
        const exerciseData = exerciseResults.reduce((acc, { id, data }) => {
          acc[id] = data;
          return acc;
        }, {});
        setExercises(exerciseData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    fetchWorkoutData();
  }, [id]);

  const handleScheduleClick = () => {
    setIsScheduling(true);
  };

  const handleLogWorkoutClick = () => {
    navigate(`/log-workout/${workoutPlan.id}`);
  };

  const handleCheckboxChange = () => {
    setOpenDialog(true);
  };

  const handleMarkAsComplete = async () => {
    try {
      const scheduledRef = doc(firestore, "scheduledWorkouts", id);
      await updateDoc(scheduledRef, { isComplete: !isCompleted });
      setIsCompleted(!isCompleted);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error marking workout as complete:", error);
    }
  };

  const calculateEstimatedDuration = () => {
    const avgSetDuration = 2;
    const totalDuration = workoutPlan.setGroups.reduce((total, group) => {
      if (group.isSuperSet)
        return (
          total + parseInt(group.number) * group.sets.length * avgSetDuration
        );
      else return total + parseInt(group.sets[0].number) * avgSetDuration;
    }, 0);
    return totalDuration;
  };

  const getColorForSuperset = (index) => {
    const colors = ["#ff5733", "#33c3ff", "#33ff57"];
    return colors[index % colors.length];
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box p={3} className="workout-detail-container">
      <Typography variant="h4" gutterBottom>
        {workoutPlan.name}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Estimated Duration: {calculateEstimatedDuration()} minutes
      </Typography>

      <Equipment exercises={exercises} workoutPlan={workoutPlan} />

      {isScheduledWorkout && (
        <Box display="flex" alignItems="center" mb={2}>
          <ListItemIcon
            className={`${isCompleted ? "completed-icon" : "incomplete-icon"}`}
          >
            {isCompleted ? (
              <CheckCircleIcon color="success" />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </ListItemIcon>
          <Typography>
            {isCompleted ? "Workout Completed" : "Incomplete"}
          </Typography>
          <Link onClick={handleCheckboxChange} style={{ marginLeft: "auto" }}>
            {isCompleted ? "Unmark As Complete" : "Mark As Complete"}
          </Link>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Mark Workout as Complete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {isCompleted ? "unmark" : "mark"} this
            workout as complete?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleMarkAsComplete} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <List>
        {workoutPlan.setGroups.map((group, index) => {
          const color = group.isSuperSet ? getColorForSuperset(index) : "#000";
          return (
            <React.Fragment key={index}>
              {group.isSuperSet && (
                <ListItem>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      style={{ color, marginLeft: "16px", fontWeight: "bold" }}
                    >
                      Superset of {group.number} sets
                    </Typography>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        backgroundColor: color,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        marginLeft: "-20px",
                      }}
                    />
                    {group.sets.map((set, setIndex) => (
                      <Box key={setIndex} mb={2} ml={2}>
                        <Grid container spacing={1}>
                          <Grid item xs={1}>
                            {exercises[set.exerciseId] && (
                              <Link href={`/exercise/${set.exerciseId}`}>
                                <img
                                  src={`../${
                                    exercises[set.exerciseId].imageUrl
                                  }`}
                                  alt={exercises[set.exerciseId].name}
                                  style={{ width: "80%" }}
                                />
                              </Link>
                            )}
                          </Grid>
                          <Grid item xs={10}>
                            <Typography>
                              {exercises[set.exerciseId]?.name}
                            </Typography>
                            <Typography>
                              {set.reps} reps
                              {set.notes ? ` - ${set.notes}` : ""}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                </ListItem>
              )}
              {!group.isSuperSet && (
                <ListItem>
                  <ListItemText
                    primary=""
                    secondary={group.sets.map((set, setIndex) => (
                      <Box key={setIndex} mb={2}>
                        <Grid container spacing={1}>
                          <Grid item xs={1}>
                            {exercises[set.exerciseId] && (
                              <Link href={`/exercise/${set.exerciseId}`}>
                                <img
                                  src={`../${
                                    exercises[set.exerciseId].imageUrl
                                  }`}
                                  alt={exercises[set.exerciseId].name}
                                  style={{ width: "80%" }}
                                />
                              </Link>
                            )}
                          </Grid>
                          <Grid item xs={10}>
                            <Typography>
                              {exercises[set.exerciseId]?.name}
                            </Typography>
                            <Typography>
                              {set.number} sets x {set.reps}
                              {set.notes ? ` - ${set.notes}` : ""}
                            </Typography>
                            <Typography>90s rest between sets</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  />
                </ListItem>
              )}
              <Divider />
            </React.Fragment>
          );
        })}
      </List>

      <Box className="sticky-buttons">
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLogWorkoutClick}
        >
          Start Now
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleScheduleClick}
        >
          Schedule Workout
        </Button>
      </Box>

      <Modal open={isScheduling} onClose={() => setIsScheduling(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "30%",
            height: "30%",
            bgcolor: "background.paper",
            boxShadow: 24,
            overflowY: "auto",
            p: 4,
          }}
        >
          <ScheduleWorkout
            workoutId={workoutPlan.id}
            onClose={() => setIsScheduling(false)}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default WorkoutPlanDetail;
