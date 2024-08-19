import React from 'react';
import { Box, Typography } from '@mui/material';

const Equipment = ({ exercises, workoutPlan }) => {
  const equipmentSet = new Set();

  workoutPlan.setGroups.forEach(group => {
    group.sets.forEach(set => {
      const exercise = exercises[set.exerciseId];
      if (exercise && exercise.equipment) {
        exercise.equipment.split(',').forEach(equip => {
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
            {equip === 'Machine' && <img src='../icons/machine2.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Body Weight' && <img src='../icons/body-weight.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Dumbbell' && <img src='../icons/dumbbell.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Barbell' && <img src='../icons/barbell.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Kettlebell' && <img src='../icons/kettlebell.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Bench' && <img src='../icons/bench.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Bike' && <img src='../icons/bike.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'AB Wheel' && <img src='../icons/abs.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            {equip === 'Sled' && <img src='../icons/sled.png' alt={equip} style={{ width: '50px', height: '50px' }} />}
            <Typography>{equip}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Equipment;
