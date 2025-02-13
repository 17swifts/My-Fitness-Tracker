import React, { useEffect, useState, useReducer, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  List,
  TextField,
  Divider,
  IconButton,
  Grid,
  Link,
  Modal,
  CircularProgress,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { firestore, auth } from "../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import dayjs from "dayjs";
import TimerIcon from "@mui/icons-material/Timer";
import ExerciseLibrary from "./exerciseLibrary/ExerciseLibrary";
import Timer from "./common/Timer";

const workoutReducer = (state, action) => {
  switch (action.type) {
    case "SET_WORKOUT_PLAN":
      return { ...state, workoutPlan: action.payload, loading: false };
    case "SET_EXERCISES":
      return { ...state, exercises: action.payload };
    case "SET_HISTORY":
      return { ...state, exerciseHistory: action.payload };
    case "SET_COMPLETED_WORKOUT":
      return { ...state, completedWorkout: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_MODAL":
      return { ...state, modalOpen: action.payload };
    case "SET_TIMER":
      return { ...state, showTimer: action.payload };
    case "SET_TIME_SPENT":
      return { ...state, timeSpent: action.payload };
    case "SET_CURRENT_GROUP":
      return { ...state, currentGroupIndex: action.payload };
    case "SET_CURRENT_EXERCISE":
      return { ...state, currentExerciseIndex: action.payload };
    default:
      return state;
  }
};

const LogWorkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(workoutReducer, {
    workoutPlan: null,
    exercises: {},
    exerciseHistory: {},
    completedWorkout: {},
    loading: true,
    modalOpen: false,
    showTimer: false,
    timeSpent: 0,
    currentGroupIndex: null,
    currentExerciseIndex: null,
  });

  const [showTimer, setShowTimer] = useState(false);

  const fetchExerciseHistory = useCallback(
    async (exerciseIds) => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const historyPromises = [...exerciseIds].map(async (exerciseId) => {
          const historyQuery = query(
            collection(firestore, "exerciseStats"),
            where("exerciseId", "==", exerciseId),
            where("userId", "==", user.uid)
          );
          const historySnapshot = await getDocs(historyQuery);
          return {
            id: exerciseId,
            data: historySnapshot.docs.map((doc) => doc.data()),
          };
        });

        const historyResults = await Promise.all(historyPromises);
        const historyData = Object.fromEntries(
          historyResults.map(({ id, data }) => [id, data])
        );

        dispatch({ type: "SET_HISTORY", payload: historyData });
      } catch (error) {
        console.error("Error fetching exercise history:", error);
      }
    },
    [dispatch]
  );

  const fetchExerciseDetails = useCallback(
    async (planData) => {
      try {
        const exerciseIds = new Set(
          planData.setGroups.flatMap((group) =>
            group.sets.map((set) => set.exerciseId)
          )
        );

        const exercisePromises = [...exerciseIds].map(async (exerciseId) => {
          const exerciseDoc = await getDoc(
            doc(firestore, "exercises", exerciseId)
          );
          return { id: exerciseId, data: exerciseDoc.data() };
        });

        const exerciseResults = await Promise.all(exercisePromises);
        const exerciseData = Object.fromEntries(
          exerciseResults.map(({ id, data }) => [id, data])
        );

        dispatch({ type: "SET_EXERCISES", payload: exerciseData });
        fetchExerciseHistory(exerciseIds);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    },
    [dispatch, fetchExerciseHistory]
  );

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      try {
        const docRef = doc(firestore, "workoutPlans", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const planData = { id: docSnap.id, ...docSnap.data() };
          dispatch({ type: "SET_WORKOUT_PLAN", payload: planData });
          fetchExerciseDetails(planData);
        }
      } catch (error) {
        console.error("Error fetching workout plan:", error);
      }
    };

    const fetchExerciseDetails = async (planData) => {
      try {
        const exerciseIds = new Set(
          planData.setGroups.flatMap((group) =>
            group.sets.map((set) => set.exerciseId)
          )
        );

        const exercisePromises = [...exerciseIds].map(async (exerciseId) => {
          const exerciseDoc = await getDoc(
            doc(firestore, "exercises", exerciseId)
          );
          return { id: exerciseId, data: exerciseDoc.data() };
        });

        const exerciseResults = await Promise.all(exercisePromises);
        const exerciseData = Object.fromEntries(
          exerciseResults.map(({ id, data }) => [id, data])
        );

        dispatch({ type: "SET_EXERCISES", payload: exerciseData });
        fetchExerciseHistory(exerciseIds);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    fetchWorkoutPlan();

    // Time tracking
    const intervalId = setInterval(() => {
      dispatch({ type: "SET_TIME_SPENT", payload: state.timeSpent + 1 });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [fetchExerciseHistory, id, state.timeSpent]);

  // Handle Input Changes
  const handleInputChange = (exerciseId, setNumber, field, value) => {
    dispatch({
      type: "SET_COMPLETED_WORKOUT",
      payload: {
        ...state.completedWorkout,
        [exerciseId]: {
          ...state.completedWorkout[exerciseId],
          [setNumber]: {
            ...state.completedWorkout[exerciseId]?.[setNumber],
            [field]: value,
          },
        },
      },
    });
  };

  const handleSaveWorkout = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const workoutDate = dayjs().format("YYYY-MM-DD");
      const workoutDuration = state.timeSpent;

      // Batch Firestore updates
      const batch = [];

      // Save logged workout
      batch.push(
        addDoc(collection(firestore, "loggedWorkouts"), {
          workoutId: id,
          date: workoutDate,
          duration: workoutDuration,
          userId: user.uid,
        })
      );

      // Update scheduled workout if it exists
      const scheduledWorkoutsQuery = query(
        collection(firestore, "scheduledWorkouts"),
        where("userId", "==", user.uid),
        where("workoutId", "==", id),
        where("date", "==", workoutDate)
      );
      const scheduledWorkoutSnapshot = await getDocs(scheduledWorkoutsQuery);

      scheduledWorkoutSnapshot.forEach((doc) =>
        batch.push(updateDoc(doc.ref, { isComplete: true }))
      );

      // Save exercise stats (Handles both Supersets & Regular Sets)
      const exerciseStatsPromises = state.workoutPlan.setGroups.flatMap(
        (group) =>
          group.sets.flatMap((set) => {
            const exerciseId = set.exerciseId;
            const numSets = group.isSuperSet
              ? group.number
              : group.sets[0].number;

            return Array.from({ length: numSets }, (_, i) => {
              const stats = state.completedWorkout[exerciseId]?.[i + 1];
              if (!stats) return null;

              return addDoc(collection(firestore, "exerciseStats"), {
                exerciseId,
                setNumber: i + 1,
                reps: stats.reps || 0,
                weight: stats.weight || 0,
                time: stats.time || 0,
                volume: stats.time
                  ? stats.time * numSets
                  : stats.reps * stats.weight * numSets,
                metric: stats.time ? stats.time : stats.reps * stats.weight,
                date: workoutDate,
                userId: user.uid,
              });
            }).filter(Boolean);
          })
      );

      // Execute Firestore operations in parallel
      await Promise.all([...batch, ...exerciseStatsPromises]);

      // Navigate back to the workout detail page
      navigate(`/workout-plans/${id}`);
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  const swapExerciseFromLibrary = async (exercise) => {
    if (state.currentGroupIndex === null || state.currentExerciseIndex === null)
      return;

    // Create a new copy of setGroups with updated exerciseId
    const updatedSetGroups = state.workoutPlan.setGroups.map(
      (group, groupIndex) =>
        groupIndex === state.currentGroupIndex
          ? {
              ...group,
              sets: group.sets.map((set, setIndex) =>
                setIndex === state.currentExerciseIndex
                  ? { ...set, exerciseId: exercise.id }
                  : set
              ),
            }
          : group
    );

    // Dispatch updated workout plan
    dispatch({
      type: "SET_WORKOUT_PLAN",
      payload: { ...state.workoutPlan, setGroups: updatedSetGroups },
    });

    // Fetch new exercise details for the swapped exercise
    await fetchExerciseDetails(state.workoutPlan);

    // Reset state after swapping
    dispatch({ type: "SET_MODAL", payload: false });
    dispatch({ type: "SET_CURRENT_GROUP", payload: null });
    dispatch({ type: "SET_CURRENT_EXERCISE", payload: null });
  };

  const handleCancel = () => {
    navigate(`/workout-plans/${id}`);
  };

  const renderHistoricalData = (exerciseId, reps, setNo) => {
    const history = state.exerciseHistory[exerciseId];
    if (!history || history.length === 0) return null;

    const lastMatch = history.find(
      (h) =>
        parseInt(h.reps) === parseInt(reps) &&
        parseInt(h.setNumber) === parseInt(setNo)
    );
    if (!lastMatch) return null;

    return (
      <Typography variant="body2" color="textSecondary">
        {lastMatch.reps} x {lastMatch.weight} kg
      </Typography>
    );
  };

  const getColorForSuperset = (index) => {
    const colors = ["#ff5733", "#33c3ff", "#33ff57"];
    return colors[index % colors.length];
  };

  const handleTimerClick = () => {
    setShowTimer(true);
  };

  const handleTimerClose = () => {
    setShowTimer(false);
  };

  const renderTextField = (exerciseId, index, value, label, type) => {
    return (
      <TextField
        label={label}
        type="number"
        value={value || ""}
        onChange={(e) =>
          handleInputChange(exerciseId, index, type, e.target.value)
        }
      />
    );
  };

  const SetItem = ({
    exerciseId,
    setIndex,
    reps,
    time,
    notes,
    timed,
    hasWeight,
    handleExerciseSwap,
    isSuperset,
  }) => {
    const exercise = state.exercises[exerciseId];
    return (
      <Box mb={2}>
        <Typography>{`${timed ? `${time}s` : `${reps} reps`} ${
          notes ? `- ${notes}` : ""
        }`}</Typography>
        <Grid container spacing={1} alignItems="center" justifyContent="left">
          <Grid item xs={1}>
            {isSuperset ? (
              <Link href={`/exercise/${exerciseId}`}>
                <img
                  src={`../${exercise?.imageUrl}`}
                  alt={exercise?.name}
                  style={{ width: "100%" }}
                />
              </Link>
            ) : (
              <Typography>{`Set ${setIndex + 1}`}</Typography>
            )}
          </Grid>
          <Grid item xs={2}>
            {!timed
              ? renderTextField(
                  exerciseId,
                  setIndex + 1,
                  state.completedWorkout[exerciseId]?.[setIndex + 1]?.reps,
                  "Reps",
                  "reps"
                )
              : renderTextField(
                  exerciseId,
                  setIndex + 1,
                  state.completedWorkout[exerciseId]?.[setIndex + 1]?.time,
                  "Time (s)",
                  "time"
                )}
          </Grid>
          <Grid item xs={2}>
            {hasWeight &&
              renderTextField(
                exerciseId,
                setIndex + 1,
                state.completedWorkout[exerciseId]?.[setIndex + 1]?.weight,
                "Weight (kg)",
                "weight"
              )}
          </Grid>
          <Grid item xs={5}></Grid>
          <Grid item xs={1}>
            {renderHistoricalData(exerciseId, reps, setIndex + 1)}
          </Grid>
          <Grid item>
            <IconButton
              onClick={() => handleExerciseSwap(exerciseId, setIndex)}
            >
              <SwapHoriz />
            </IconButton>
          </Grid>
        </Grid>
        <Divider />
      </Box>
    );
  };

  const ExerciseGroup = ({ group, handleExerciseSwap }) => {
    const exercise = state.exercises[group.sets[0].exerciseId];

    return (
      <Box mb={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={1}>
            <Link href={`/exercise/${group.sets[0].exerciseId}`}>
              <img
                src={`../${exercise?.imageUrl}`}
                alt={exercise?.name}
                style={{ width: "100%" }}
              />
            </Link>
          </Grid>
          <Grid item xs={9}>
            <Typography variant="h7" gutterBottom>
              {exercise?.name}
            </Typography>
            <Typography variant="subtitle1">
              {group.sets[0].number} sets x{" "}
              {exercise?.timed ? `${group.sets[0].time}s` : group.sets[0].reps}
              {group.sets[0].notes ? ` - ${group.sets[0].notes}` : ""}
            </Typography>
          </Grid>
        </Grid>
        {Array.from({ length: group.sets[0].number }).map((_, setIndex) => (
          <SetItem
            key={`${group.sets[0].exerciseId}-${setIndex}`}
            exerciseId={group.sets[0].exerciseId}
            setIndex={setIndex}
            reps={group.sets[0].reps}
            time={group.sets[0].time}
            notes={group.sets[0].notes}
            timed={exercise?.timed}
            hasWeight={exercise?.hasWeight}
            handleExerciseSwap={handleExerciseSwap}
            isSuperset={false}
          />
        ))}
      </Box>
    );
  };

  const SupersetGroup = ({ group, index, handleExerciseSwap }) => {
    const color = group.isSuperSet ? getColorForSuperset(index) : "#000";
    return (
      <Box display="flex" flexDirection="column" position="relative">
        <Typography
          variant="h5"
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
        {Array.from({ length: group.number }).map((_, setIndex) => (
          <React.Fragment key={setIndex}>
            <Typography variant="h6">{`Set ${setIndex + 1}`}</Typography>
            {group.sets.map((set) => (
              <SetItem
                key={`${set.exerciseId}-${setIndex}`}
                exerciseId={set.exerciseId}
                setIndex={setIndex}
                reps={set.reps}
                time={set.time}
                notes={set.notes}
                timed={state.exercises[set.exerciseId]?.timed}
                hasWeight={state.exercises[set.exerciseId]?.hasWeight}
                handleExerciseSwap={handleExerciseSwap}
                isSuperset={true}
              />
            ))}
            <Box mb={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={1}>
                  <img
                    src="../assets/rest.png"
                    alt="rest"
                    style={{ width: "70%" }}
                  />
                </Grid>
                <Grid item xs={9}>
                  <Typography>Rest for 90s</Typography>
                </Grid>
              </Grid>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    );
  };

  if (state.loading) return <CircularProgress />;

  return (
    <Box p={3}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "white",
          pb: 2,
        }}
      >
        <Button variant="contained" color="primary" onClick={handleSaveWorkout}>
          Save
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleCancel}
          sx={{ ml: 2 }}
        >
          Cancel
        </Button>
        <IconButton onClick={handleTimerClick}>
          <TimerIcon />
        </IconButton>
        {/* Conditionally render the TimerComponent when the icon is clicked */}
        {showTimer && <Timer onClose={handleTimerClose} />}
      </Box>

      <Modal
        open={state.modalOpen}
        onClose={() => dispatch({ type: "SET_MODAL", payload: false })}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            bgcolor: "background.paper",
            boxShadow: 24,
            overflowY: "auto",
            p: 4,
          }}
        >
          <ExerciseLibrary
            onSelectExercise={swapExerciseFromLibrary}
            onClose={() => dispatch({ type: "SET_MODAL", payload: false })}
          />
        </Box>
      </Modal>

      <Typography variant="h4" gutterBottom>
        {state.workoutPlan.name}
      </Typography>

      {state.workoutPlan.instructions && (
        <Box mb={2}>
          <Typography variant="h6">Instructions:</Typography>
          <Typography
            dangerouslySetInnerHTML={{ __html: state.workoutPlan.instructions }}
          ></Typography>
        </Box>
      )}

      <List>
        {state.workoutPlan.setGroups.map((group, index) =>
          group.isSuperSet ? (
            <SupersetGroup
              key={index}
              group={group}
              index={index}
              handleExerciseSwap={(setIndex) => {
                dispatch({ type: "SET_MODAL", payload: true });
                dispatch({ type: "SET_CURRENT_GROUP", payload: index });
                dispatch({ type: "SET_CURRENT_EXERCISE", payload: setIndex });
              }}
            />
          ) : (
            <ExerciseGroup
              key={index}
              group={group}
              handleExerciseSwap={(setIndex) => {
                dispatch({ type: "SET_MODAL", payload: true });
                dispatch({ type: "SET_CURRENT_GROUP", payload: index });
                dispatch({ type: "SET_CURRENT_EXERCISE", payload: setIndex });
              }}
            />
          )
        )}
      </List>
    </Box>
  );
};

export default LogWorkout;
