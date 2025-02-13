import React, { useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, firestore } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Modal,
  Box,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ExerciseLibrary from "./exerciseLibrary/ExerciseLibrary";
import { Delete } from "@mui/icons-material";
import dayjs from "dayjs";
import "./styles/CreateWorkoutPlan.css";

// Initial state for reducer
const initialState = {
  planName: "",
  planInstructions: "",
  setGroups: [],
  exercises: {},
  isAddingExercise: false,
  isEditing: false,
  loading: false,
  currentGroupIndex: null,
  showSaveModal: false,
};

// Reducer for managing state
const workoutReducer = (state, action) => {
  switch (action.type) {
    case "SET_PLAN":
      return {
        ...state,
        planName: action.payload.name,
        planInstructions: action.payload.instructions,
        setGroups: action.payload.setGroups,
        isEditing: true,
      };
    case "SET_EXERCISES":
      return { ...state, exercises: action.payload };
    case "UPDATE_SET_GROUPS":
      return { ...state, setGroups: action.payload };
    case "SHOW_SAVE_MODAL":
      return { ...state, showSaveModal: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "TOGGLE_ADD_EXERCISE":
      return { ...state, isAddingExercise: action.payload };
    case "SET_GROUP_INDEX":
      return { ...state, currentGroupIndex: action.payload };
    case "UPDATE_PLAN_NAME":
      return { ...state, planName: action.payload };
    case "UPDATE_PLAN_INSTRUCTIONS":
      return { ...state, planInstructions: action.payload };
    case "RESET_PLAN":
      return { ...initialState };
    default:
      return state;
  }
};

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, dispatch] = useReducer(workoutReducer, {
    planName: "",
    planInstructions: "",
    setGroups: [],
    exercises: {},
    loading: false,
    isEditing: !!id,
    showSaveModal: false,
    isAddingExercise: false,
    currentGroupIndex: null,
  });

  useEffect(() => {
    if (id) {
      dispatch({ type: "SET_LOADING", payload: true });
      const fetchPlanDetails = async () => {
        try {
          const docRef = doc(firestore, "workoutPlans", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const planData = docSnap.data();
            dispatch({ type: "SET_PLAN", payload: planData });
            fetchExerciseDetails(planData);
          }
        } catch (error) {
          console.error("Error fetching plan details:", error);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      };

      const fetchExerciseDetails = async (planData) => {
        try {
          const exerciseIds = new Set();
          planData.setGroups.forEach((group) =>
            group.sets.forEach((set) => exerciseIds.add(set.exerciseId))
          );

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

          dispatch({ type: "SET_EXERCISES", payload: exerciseData });
        } catch (error) {
          console.error("Error fetching exercises:", error);
        }
      };

      fetchPlanDetails();
    }
  }, [id]);

  const handleSavePlan = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const planData = {
        userId: user.uid,
        name: state.planName,
        instructions: state.planInstructions || "",
        createdDate: dayjs().format("YYYY-MM-DD"),
        setGroups: state.setGroups.map((group) => ({
          number: group.isSuperSet ? group.number : null,
          isSuperSet: group.isSuperSet,
          sets: group.sets.map((exercise) => ({
            number: group.isSuperSet ? null : exercise.number,
            reps: exercise.reps,
            time: exercise.time || 0,
            exerciseId: exercise.exerciseId,
            notes: exercise.notes || "",
          })),
        })),
      };

      if (state.isEditing) {
        dispatch({ type: "SHOW_SAVE_MODAL", payload: true });
      } else {
        await addDoc(collection(firestore, "workoutPlans"), planData);
        dispatch({ type: "RESET_PLAN" });
        navigate("/workout-plans");
      }
    } catch (error) {
      console.error("Error saving workout plan:", error);
    }
  };

  const confirmSaveOption = async (saveAsNew) => {
    const user = auth.currentUser;
    if (!user) return;

    const planData = {
      userId: user.uid,
      name: state.planName,
      instructions: state.planInstructions || "",
      createdDate: dayjs().format("YYYY-MM-DD"),
      setGroups: state.setGroups.map((group) => ({
        number: group.isSuperSet ? group.number : null,
        isSuperSet: group.isSuperSet,
        sets: group.sets.map((exercise) => ({
          number: group.isSuperSet ? null : exercise.number,
          reps: exercise.reps,
          time: exercise.time || 0,
          exerciseId: exercise.exerciseId,
          notes: exercise.notes || "",
        })),
      })),
    };

    if (saveAsNew) {
      await addDoc(collection(firestore, "workoutPlans"), planData);
    } else {
      await updateDoc(doc(firestore, "workoutPlans", id), planData);
    }

    dispatch({ type: "RESET_PLAN" });
    navigate("/workout-plans");
  };

  const addExercise = async (exercise) => {
    dispatch({ type: "SET_LOADING", payload: true });

    dispatch({
      type: "SET_EXERCISES",
      payload: { ...state.exercises, [exercise.id]: exercise },
    });

    // Add the exercise to an existing group or create a new group
    const updatedSetGroups = [...state.setGroups];

    if (state.currentGroupIndex !== null) {
      updatedSetGroups[state.currentGroupIndex].sets.push({
        exerciseId: exercise.id,
        number: 0,
        reps: 0,
        time: 0,
        notes: "",
      });
    } else {
      updatedSetGroups.push({
        isSuperSet: false,
        sets: [
          {
            exerciseId: exercise.id,
            number: 0,
            reps: 0,
            time: 0,
            notes: "",
          },
        ],
      });
    }

    dispatch({ type: "UPDATE_SET_GROUPS", payload: updatedSetGroups });

    dispatch({ type: "SET_LOADING", payload: false });
    dispatch({ type: "TOGGLE_ADD_EXERCISE", payload: false });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    const reorderedGroups = [...state.setGroups];
    const [movedSetGroup] = reorderedGroups.splice(source.index, 1);
    reorderedGroups.splice(destination.index, 0, movedSetGroup);

    dispatch({
      type: "UPDATE_SET_GROUPS",
      payload: reorderedGroups,
    });
  };

  const updateExercise = (groupIndex, exerciseIndex, field, value) => {
    dispatch({
      type: "UPDATE_SET_GROUPS",
      payload: state.setGroups.map((group, gIndex) =>
        gIndex === groupIndex
          ? {
              ...group,
              sets: group.sets.map((exercise, eIndex) =>
                eIndex === exerciseIndex
                  ? { ...exercise, [field]: value }
                  : exercise
              ),
            }
          : group
      ),
    });
  };

  const updateGroup = (groupIndex, field, value) => {
    const updatedGroups = state.setGroups.map((group, index) =>
      index === groupIndex ? { ...group, [field]: value } : group
    );

    dispatch({
      type: "UPDATE_SET_GROUPS",
      payload: updatedGroups,
    });
  };

  const removeExercise = (groupIndex, exerciseIndex, exerciseId) => {
    dispatch({
      type: "UPDATE_SET_GROUPS",
      payload: state.setGroups
        .map((group, gIndex) =>
          gIndex === groupIndex
            ? {
                ...group,
                sets: group.sets.filter(
                  (_, eIndex) => eIndex !== exerciseIndex
                ),
              }
            : group
        )
        .filter((group) => group.sets.length > 0),
    });

    dispatch({
      type: "SET_EXERCISES",
      payload: Object.fromEntries(
        Object.entries(state.exercises).filter(([key]) => key !== exerciseId)
      ),
    });
  };

  const toggleSuperSet = (groupIndex) => {
    const updatedGroups = state.setGroups.map((group, index) =>
      index === groupIndex
        ? {
            ...group,
            isSuperSet: !group.isSuperSet,
            number: group.isSuperSet ? null : 1,
          }
        : group
    );

    dispatch({
      type: "UPDATE_SET_GROUPS",
      payload: updatedGroups,
    });
  };

  const handleModalClose = () => {
    dispatch({ type: "SHOW_SAVE_MODAL", payload: false });
  };

  const renderTextField = (index, value, label, type, groupIndex = -1) => {
    return (
      <TextField
        label={label}
        type="number"
        value={value || ""}
        onChange={(e) =>
          groupIndex === -1
            ? updateGroup(index, type, e.target.value)
            : updateExercise(groupIndex, index, type, e.target.value)
        }
        fullWidth
      />
    );
  };

  const ExerciseItem = ({
    group,
    exercise,
    groupIndex,
    exerciseIndex,
    isSuperset,
  }) => (
    <React.Fragment key={exerciseIndex}>
      <Grid item xs={2}>
        {state.exercises[exercise.exerciseId] && (
          <img
            src={`../${state.exercises[exercise.exerciseId].imageUrl}`}
            alt={state.exercises[exercise.exerciseId].name}
            style={{ width: "80%" }}
          />
        )}
      </Grid>
      <Grid item xs={isSuperset ? 3 : 2}>
        <Typography>{state.exercises[exercise.exerciseId]?.name}</Typography>
      </Grid>
      {!isSuperset && (
        <Grid item xs={2}>
          {renderTextField(groupIndex, group.number, "Sets", "number")}
        </Grid>
      )}
      {!state.exercises[exercise.exerciseId]?.timed ? (
        <Grid item xs={2}>
          {renderTextField(
            exerciseIndex,
            exercise.reps,
            "Reps",
            "reps",
            groupIndex
          )}
        </Grid>
      ) : (
        <Grid item xs={2}>
          {renderTextField(
            exerciseIndex,
            exercise.time,
            "Time (s)",
            "time",
            groupIndex
          )}
        </Grid>
      )}
      <Grid item xs={isSuperset ? 4 : 3}>
        {renderTextField(
          exerciseIndex,
          exercise.notes,
          "Notes",
          "notes",
          groupIndex
        )}
      </Grid>
      <Grid item xs={1}>
        <IconButton
          onClick={() =>
            removeExercise(groupIndex, exerciseIndex, exercise.exerciseId)
          }
        >
          <Delete />
        </IconButton>
      </Grid>
    </React.Fragment>
  );

  const WorkoutGroup = ({ group, groupIndex }) => (
    <Draggable
      key={groupIndex}
      draggableId={`${groupIndex}`}
      index={groupIndex}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Grid
            container
            spacing={2}
            alignItems="center"
            className="grid-container"
          >
            <Grid item xs={3}>
              {group.isSuperSet &&
                renderTextField(groupIndex, group.number, "Sets", "number")}
            </Grid>
            <Grid item xs={9}>
              <FormControlLabel
                control={
                  <Switch
                    checked={group.isSuperSet}
                    onChange={() => toggleSuperSet(groupIndex)}
                    name="isSuperSet"
                    color="primary"
                  />
                }
                label="Make Super Set"
              />
            </Grid>

            {group.sets.map((exercise, exerciseIndex) => (
              <ExerciseItem
                key={exerciseIndex}
                group={group}
                exercise={exercise}
                groupIndex={groupIndex}
                exerciseIndex={exerciseIndex}
                isSuperset={group.isSuperSet}
              />
            ))}

            {group.isSuperSet && (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    dispatch({ type: "TOGGLE_ADD_EXERCISE", payload: true });
                    dispatch({ type: "SET_GROUP_INDEX", payload: groupIndex });
                  }}
                >
                  Add Another Exercise to Super Set
                </Button>
              </Grid>
            )}
          </Grid>
          <Divider style={{ margin: "20px 0" }} />
        </div>
      )}
    </Draggable>
  );

  if (state.loading) return <CircularProgress />;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {state.isEditing ? "Edit Workout Plan" : "Create Workout Plan"}
      </Typography>
      <TextField
        label="Plan Name"
        value={state.planName}
        onChange={(e) =>
          dispatch({ type: "UPDATE_PLAN_NAME", payload: e.target.value })
        }
        fullWidth
        margin="normal"
      />
      <TextField
        id="outlined-multiline-static"
        label="Instructions"
        fullWidth
        multiline
        margin="normal"
        rows={5}
        value={state.planInstructions
          .toString()
          .replace(new RegExp("<br>", "g"), "\n")}
        onChange={(e) => {
          const formattedText = e.target.value.replace(/\n/g, "<br>");
          dispatch({
            type: "UPDATE_PLAN_INSTRUCTIONS",
            payload: formattedText,
          });
        }}
      />

      <Modal
        open={state.isAddingExercise}
        onClose={() =>
          dispatch({ type: "TOGGLE_ADD_EXERCISE", payload: false })
        }
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
            onSelectExercise={addExercise}
            onClose={() =>
              dispatch({ type: "TOGGLE_ADD_EXERCISE", payload: false })
            }
          />
        </Box>
      </Modal>

      {/* Modal for Save as New or Edit Existing */}
      <Modal open={state.showSaveModal} onClose={handleModalClose}>
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
          <Typography variant="h6" gutterBottom>
            Do you want to save this workout as a new workout or update the
            existing one?
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              confirmSaveOption(false);
              handleModalClose();
            }}
          >
            Update Existing
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              confirmSaveOption(true);
              handleModalClose();
            }}
          >
            Save as New
          </Button>
        </Box>
      </Modal>

      <div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(provided, snapshot) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {state.setGroups.map((group, groupIndex) => (
                  <WorkoutGroup
                    key={groupIndex}
                    group={group}
                    groupIndex={groupIndex}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          dispatch({
            type: "TOGGLE_ADD_EXERCISE",
            payload: true,
          });
          dispatch({
            type: "SET_GROUP_INDEX",
            payload: null,
          });
        }}
      >
        Add Exercises
      </Button>

      <Box mt={3} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePlan}
          style={{ marginRight: "8px" }}
        >
          Save Workout Plan
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate("/workout-plans")}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default CreateWorkoutPlan;
