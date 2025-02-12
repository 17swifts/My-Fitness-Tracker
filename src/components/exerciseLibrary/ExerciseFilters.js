import React from "react";
import { TextField, Box, Select, MenuItem } from "@mui/material";

const ExerciseFilters = ({
  filter,
  setFilter,
  category,
  setCategory,
  search,
  setSearch,
}) => (
  <Box sx={{ mb: 2 }}>
    <TextField
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search Exercises"
      fullWidth
      sx={{ mb: 1 }}
    />
    <Select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      fullWidth
      displayEmpty
    >
      <MenuItem value="">All Muscle Groups</MenuItem>
      {[
        "Back",
        "Shoulders",
        "Core",
        "Chest",
        "Biceps",
        "Triceps",
        "Glutes",
        "Calves",
        "Hamstrings",
        "Quads",
        "Full Body",
        "Cardio",
        "Forearm",
      ].map((muscle) => (
        <MenuItem key={muscle} value={muscle}>
          {muscle}
        </MenuItem>
      ))}
    </Select>
    <Select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      fullWidth
      displayEmpty
      sx={{ mt: 1 }}
    >
      <MenuItem value="">All Categories</MenuItem>
      {["Push", "Pull", "Squat", "Lunge", "Hinge", "Gait", "Twist"].map(
        (cat) => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        )
      )}
    </Select>
  </Box>
);

export default ExerciseFilters;
