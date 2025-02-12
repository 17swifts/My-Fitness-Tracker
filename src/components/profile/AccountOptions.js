import React from "react";
import { Box, Typography, List, ListItem, ListItemIcon } from "@mui/material";
import { AccountCircle, Notifications } from "@mui/icons-material";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const AccountOptions = ({ navigate }) => (
  <Box mt={3} mb={3} textAlign="left">
    <Typography variant="h6" gutterBottom>
      My Account
    </Typography>
    <List>
      <ListItem button onClick={() => navigate("/update-profile")}>
        <ListItemIcon>
          <AccountCircle />
        </ListItemIcon>
        My Profile
      </ListItem>
      <ListItem button onClick={() => navigate("/notifications")}>
        <ListItemIcon>
          <Notifications />
        </ListItemIcon>
        Notifications
      </ListItem>
      <ListItem button onClick={() => navigate("/units")}>
        <ListItemIcon>
          <AnalyticsIcon />
        </ListItemIcon>
        Units
      </ListItem>
    </List>
  </Box>
);

export default AccountOptions;
