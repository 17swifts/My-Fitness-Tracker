import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

const SaveWorkoutModal = ({ open, onClose, onSave }) => (
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
      <Typography variant="h6" gutterBottom>
        Do you want to save this workout as a new plan or update the existing
        one?
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          onSave(false);
          onClose();
        }}
      >
        Update Existing
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          onSave(true);
          onClose();
        }}
      >
        Save as New
      </Button>
    </Box>
  </Modal>
);
export default SaveWorkoutModal;
