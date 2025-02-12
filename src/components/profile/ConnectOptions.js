import React from "react";
import { Box, Typography, List, ListItem, ListItemIcon } from "@mui/material";
import { Fitbit } from "@mui/icons-material";

const ConnectOptions = ({ navigate }) => (
  <Box mt={3} textAlign="left">
    <Typography variant="h6" gutterBottom>
      Connect
    </Typography>
    <List>
      <ListItem button onClick={() => navigate("/connect/fitbit")}>
        <ListItemIcon>
          <Fitbit />
        </ListItemIcon>
        Fitbit
      </ListItem>
      <ListItem button onClick={() => navigate("/connect/myfitnesspal")}>
        MyFitnessPal
      </ListItem>
      <ListItem button onClick={() => navigate("/connect/garmin")}>
        Garmin
      </ListItem>
      <ListItem button onClick={() => navigate("/connect/inbody")}>
        InBody
      </ListItem>
    </List>
  </Box>
);

export default ConnectOptions;
