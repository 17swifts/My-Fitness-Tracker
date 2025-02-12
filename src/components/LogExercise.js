import React, { useState, useReducer } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  Modal,
  Link,
  DialogContentText,
} from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import ExerciseLibrary from "./exerciseLibrary/ExerciseLibrary";

// Reducer to manage exercise data
const exerciseReducer = (state, action) => {
  switch (action.type) {
    case "SET_SETS":
      return {
        ...state,
        sets: action.payload,
        data: Array.from({ length: action.payload }, () => ({
          reps: "",
          weight: "",
          time: "",
        })),
      };
    case "UPDATE_SET":
      return {
        ...state,
        data: state.data.map((set, index) =>
          index === action.index
            ? { ...set, [action.field]: action.value }
            : set
        ),
      };
    case "RESET":
      return { sets: "", data: [] };
    default:
      return state;
  }
};

const LogExercise = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [state, dispatch] = useReducer(exerciseReducer, { sets: "", data: [] });
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const navigate = useNavigate();

  const handleLog = async () => {
    const user = auth.currentUser;
    if (!user || !selectedExercise || state.sets <= 0) return;

    try {
      // Batch processing instead of separate writes
      const batchData = state.data.map((stats, index) => ({
        exerciseId: selectedExercise.id,
        setNumber: index + 1,
        reps: stats.reps,
        weight: stats.weight || 0,
        time: stats.time || 0,
        volume: (stats.reps || 0) * (stats.weight || 0) * state.sets,
        metric: (stats.reps || 0) * (stats.weight || 0),
        date: new Date().toLocaleDateString(),
        userId: user.uid,
      }));

      await Promise.all(
        batchData.map((entry) =>
          addDoc(collection(firestore, "exerciseStats"), entry)
        )
      );

      setConfirmationOpen(true);
    } catch (error) {
      console.error("Error logging exercise:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h5">Log Exercise</Typography>

      {/* Exercise Selection */}
      <ExerciseSelection
        selectedExercise={selectedExercise}
        onSelectExercise={setSelectedExercise}
      />

      {/* Sets Input */}
      {selectedExercise && (
        <TextField
          type="number"
          label="Number of Sets"
          value={state.sets}
          onChange={(e) =>
            dispatch({ type: "SET_SETS", payload: parseInt(e.target.value) })
          }
          fullWidth
          margin="normal"
        />
      )}

      {/* Dynamic Inputs */}
      {state.sets > 0 && (
        <SetInputFields
          sets={state.sets}
          exerciseData={state.data}
          updateExerciseData={(index, field, value) =>
            dispatch({ type: "UPDATE_SET", index, field, value })
          }
          isTimed={selectedExercise?.timed}
        />
      )}

      {/* Log Button */}
      {selectedExercise && state.sets > 0 && (
        <Button variant="contained" color="primary" onClick={handleLog}>
          Log Exercise
        </Button>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={(logAnother) => {
          setConfirmationOpen(false);
          logAnother ? dispatch({ type: "RESET" }) : navigate("/dashboard");
        }}
      />
    </Box>
  );
};

export default LogExercise;

const SetInputFields = ({
  sets,
  exerciseData,
  updateExerciseData,
  isTimed,
}) => {
  return (
    <>
      {Array.from({ length: sets }, (_, index) => (
        <Box key={index} display="flex" gap={2} alignItems="center">
          {!isTimed && (
            <TextField
              type="number"
              label={`Set ${index + 1} Reps`}
              value={exerciseData[index]?.reps || ""}
              onChange={(e) =>
                updateExerciseData(index, "reps", e.target.value)
              }
              fullWidth
              margin="normal"
            />
          )}
          {!isTimed ? (
            <TextField
              type="number"
              label={`Set ${index + 1} Weight (kg)`}
              value={exerciseData[index]?.weight || ""}
              onChange={(e) =>
                updateExerciseData(index, "weight", e.target.value)
              }
              fullWidth
              margin="normal"
            />
          ) : (
            <TextField
              type="number"
              label={`Set ${index + 1} Time (s)`}
              value={exerciseData[index]?.time || ""}
              onChange={(e) =>
                updateExerciseData(index, "time", e.target.value)
              }
              fullWidth
              margin="normal"
            />
          )}
        </Box>
      ))}
    </>
  );
};

const ExerciseSelection = ({ selectedExercise, onSelectExercise }) => {
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  return (
    <Box>
      {!selectedExercise ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsAddingExercise(true)}
        >
          Search Exercises
        </Button>
      ) : (
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={1}>
            <Link href={`/exercise/${selectedExercise.id}`}>
              <img
                src={`../${selectedExercise.imageUrl}`}
                alt={selectedExercise.name}
                style={{ width: "100%" }}
              />
            </Link>
          </Grid>
          <Grid item xs={4}>
            <Typography>{selectedExercise.name}</Typography>
          </Grid>
        </Grid>
      )}

      {/* Exercise Library Modal */}
      <Modal open={isAddingExercise} onClose={() => setIsAddingExercise(false)}>
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
            onSelectExercise={(exercise) => {
              onSelectExercise(exercise);
              setIsAddingExercise(false);
            }}
            onClose={() => setIsAddingExercise(false)}
          />
        </Box>
      </Modal>
    </Box>
  );
};

const ConfirmationDialog = ({ open, onClose }) => (
  <Dialog open={open} onClose={() => onClose(false)}>
    <DialogContent>
      <DialogContentText>
        Exercise logged successfully! Do you want to log another exercise?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => onClose(false)} color="primary">
        No
      </Button>
      <Button onClick={() => onClose(true)} color="primary" autoFocus>
        Yes
      </Button>
    </DialogActions>
  </Dialog>
);
