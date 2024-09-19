import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Dialog, DialogActions, DialogContent, DialogContentText, Modal, Grid, Link } from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import ExerciseLibrary from './ExerciseLibrary';
import { useNavigate } from 'react-router-dom';

const LogExercise = () => {
    const [selectedExercise, setSelectedExercise] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [exerciseData, setExerciseData] = useState([]);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const navigate = useNavigate();

    const handleSetsChange = (e) => {
        const numSets = parseInt(e.target.value);
        setSets(numSets);
        setExerciseData(Array.from({ length: numSets }, () => ({ reps: '', weight: '', time: '' })));
    };

    const handleRepsChange = (index, value) => {
        const updatedData = [...exerciseData];
        updatedData[index].reps = value;
        setExerciseData(updatedData);
    };

    const handleWeightChange = (index, value) => {
        const updatedData = [...exerciseData];
        updatedData[index].weight = value;
        setExerciseData(updatedData);
    };

    const handleTimeChange = (index, value) => {
        const updatedData = [...exerciseData];
        updatedData[index].time = value;
        setExerciseData(updatedData);
    };

    const handleLog = async () => {
        const user = auth.currentUser;
        if (user && selectedExercise && exerciseData.length > 0) {
            try {
                Array.from(Array(parseInt(sets)).keys()).forEach(async i => {
                    const stats = exerciseData[i + 1];
                    if (stats) {
                        await addDoc(collection(firestore, 'exerciseStats'), {
                            exerciseId: selectedExercise.id,
                            setNumber: i + 1,
                            reps: stats.reps,
                            weight: stats.weight ? stats.weight : 0,
                            time: stats.time ? stats.time : 0,
                            volume: parseInt(stats.reps) * parseInt(stats.weight) * parseInt(sets),
                            metric: parseInt(stats.reps) * parseInt(stats.weight),
                            date: new Date().toLocaleDateString(),
                            userId: user.uid
                        });
                    }
                });
                setConfirmationOpen(true);
            } catch (error) {
                console.error('Error logging exercise:', error);
            }
        }
    };

    const handleConfirmationClose = (logAnother) => {
        setConfirmationOpen(false);
        if (logAnother) {
            setSelectedExercise('');
            setSets('');
            setReps('');
            setExerciseData([]);
        } else {
            navigate('/dashboard');
        }
    };

    const selectExercise = async (exercise) => {
        console.log(exercise);
        setSelectedExercise(exercise);
        setIsAddingExercise(false);
    };

    return (
        <Box>
            <Typography variant="h5">Log Exercise</Typography>

            {!selectedExercise && (
                <Button variant="contained" color="primary" onClick={() => { setIsAddingExercise(true); }}>
                    Search Exercises
                </Button>
            )}
            <Modal open={isAddingExercise} onClose={() => setIsAddingExercise(false)}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', bgcolor: 'background.paper', boxShadow: 24, overflowY: 'auto', p: 4 }}>
                    <ExerciseLibrary onSelectExercise={selectExercise} onClose={() => setIsAddingExercise(false)} />
                </Box>
            </Modal>

            {/* Sets and Reps Input */}
            {selectedExercise && (
                <Grid container spacing={1} alignItems="center" justifyContent="left">
                    <Grid item xs={1}>
                        <Link href={`/exercise/${selectedExercise.id}`}>
                            <img
                                src={`../${selectedExercise.imageUrl}`}
                                alt={selectedExercise.name}
                                style={{ width: '100%' }}
                            />
                        </Link>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography>{selectedExercise.name}</Typography>
                    </Grid>
                    <TextField
                        type="number"
                        label="Number of Sets"
                        value={sets}
                        onChange={handleSetsChange}
                        fullWidth
                        margin="normal"
                    />
                </Grid>
            )}

            {/* Dynamic Inputs for Reps and Weight */}
            {sets && (
                exerciseData.map((set, index) => (
                    <Box key={index} display="flex" gap={2} alignItems="center">
                        {!selectedExercise.timed && (
                            <TextField
                                type="number"
                                label={`Set ${index + 1} Reps`}
                                value={set.reps}
                                onChange={(e) => handleRepsChange(index, e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                        )};
                        {!selectedExercise.timed ? (
                            <TextField
                                type="number"
                                label={`Set ${index + 1} Weight (kg)`}
                                value={set.weight}
                                onChange={(e) => handleWeightChange(index, e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                        ) : (
                            <TextField
                                label={`Set ${index + 1} Time (s)`}
                                type="number"
                                fullWidth
                                margin="normal"
                                value={set.time}
                                onChange={(e) => handleTimeChange(index, e.target.value)}
                            />)}
                    </Box>
                ))
            )}

            {/* Log Button */}
            {selectedExercise && sets && (
                <Button variant="contained" color="primary" onClick={handleLog}>
                    Log Exercise
                </Button>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmationOpen} onClose={() => handleConfirmationClose(false)}>
                <DialogContent>
                    <DialogContentText>
                        Exercise logged successfully! Do you want to log another exercise?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConfirmationClose(false)} color="primary">
                        No
                    </Button>
                    <Button onClick={() => handleConfirmationClose(true)} color="primary" autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LogExercise;