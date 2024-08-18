import React from 'react';
import { Box, Typography } from '@mui/material';

const Equipment = ({ exercises, workoutPlan }) => {
  const equipmentSet = new Set();

  workoutPlan.setGroups.forEach(group => {
    group.sets.forEach(set => {
      const exercise = exercises[set.exerciseId];
      if (exercise && exercise.equipment) {
        exercise.equipment.forEach(equip => {
          equipmentSet.add(equip);
        });
      }
    });
  });

  const equipmentArray = Array.from(equipmentSet);

  return (
    <Box mb={2}>
      <Typography variant="h6">Equipment Needed:</Typography>
      <Box display="flex" flexDirection="row" flexWrap="wrap">
        {equipmentArray.map((equip, index) => (
          <Box key={index} mr={2} mb={2} textAlign="center">
            <img src={equip.imageUrl} alt={equip.name} style={{ width: '50px', height: '50px' }} />
            <Typography>{equip.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Equipment;
