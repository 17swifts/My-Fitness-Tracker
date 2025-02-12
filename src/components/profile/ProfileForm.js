import React from "react";
import { TextField, Button, MenuItem } from "@mui/material";

const ProfileForm = ({ profileData, dispatch, handleSubmit }) => {
  // Handle Input Change
  const handleChange = (e) => {
    dispatch({
      type: "UPDATE_FIELD",
      field: e.target.name,
      value: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="First Name"
        name="firstName"
        value={profileData.firstName}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Last Name"
        name="lastName"
        value={profileData.lastName}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Date of Birth"
        name="dob"
        type="date"
        value={profileData.dob}
        onChange={handleChange}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Height (cm)"
        name="height"
        value={profileData.height}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Sex"
        name="sex"
        select
        value={profileData.sex}
        onChange={handleChange}
        fullWidth
        margin="normal"
      >
        <MenuItem value="male">Male</MenuItem>
        <MenuItem value="female">Female</MenuItem>
        <MenuItem value="other">Other</MenuItem>
      </TextField>
      <TextField
        label="Activity Level"
        name="activityLevel"
        select
        value={profileData.activityLevel}
        onChange={handleChange}
        fullWidth
        margin="normal"
      >
        <MenuItem value="sedentary">Sedentary</MenuItem>
        <MenuItem value="light">Lightly Active</MenuItem>
        <MenuItem value="moderate">Moderately Active</MenuItem>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="veryActive">Very Active</MenuItem>
      </TextField>
      <TextField
        label="Country"
        name="country"
        value={profileData.country}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="City"
        name="city"
        value={profileData.city}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Save Changes
      </Button>
    </form>
  );
};

export default ProfileForm;
