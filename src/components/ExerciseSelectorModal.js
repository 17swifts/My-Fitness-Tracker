import React from "react";
import { Modal, Box } from "@mui/material";
import ExerciseLibrary from "./exerciseLibrary/ExerciseLibrary";

const ExerciseSelectorModal = ({ open, onClose, onSelect }) => (
  <Modal open={open} onClose={onClose}>
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
      <ExerciseLibrary onSelectExercise={onSelect} onClose={onClose} />
    </Box>
  </Modal>
);

export default ExerciseSelectorModal;
