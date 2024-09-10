import React from 'react';
import { Box, Typography } from '@mui/material';

const Equipment = ({ exercises, workoutPlan }) => {
  const equipmentSet = new Set();

  workoutPlan.setGroups.forEach(group => {
    group.sets.forEach(set => {
      const exercise = exercises[set.exerciseId];
      if (exercise && exercise.equipment) {
        exercise.equipment.split(',').forEach(equip => {
          equipmentSet.add(equip.trim());
        });
      }
    });
  });

  const equipmentArray = Array.from(equipmentSet);

  const equipmentIcons = {
    'Machine': '../icons/machine2.png',
    'Body Weight': '../icons/body-weight.png',
    'Dumbbell': '../icons/dumbbell.png',
    'Barbell': '../icons/barbell.png',
    'Kettlebell': '../icons/kettlebell.png',
    'Bench': '../icons/bench.png',
    'Bike': '../icons/bike.png',
    'AB Wheel': '../icons/abs.png',
    'Sled': '../icons/sled.png',
    'Plate': '../icons/plate.png',
    'Met Ball': '../icons/medicine-ball.png',
  };

  return (
    <Box mb={2}>
      <Typography variant="h6">Equipment Needed:</Typography>
      <Box display="flex" flexDirection="row" flexWrap="wrap">
        {equipmentArray.map((equip, index) => (
          <Box key={index} mr={2} mb={2} textAlign="center">
            {equipmentIcons[equip] && (
              <img 
                src={equipmentIcons[equip]} 
                alt={equip} 
                style={{ width: '50px', height: '50px' }} 
              />
            )}
            <Typography>{equip}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Equipment;
