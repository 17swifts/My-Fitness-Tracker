import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Box, Typography, IconButton, Divider, Grid } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { firestore, auth } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const ExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [exerciseData, setExerciseData] = useState(null);
  const [statsData, setStatsData] = useState([]);

  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        const user = auth.currentUser;
        const exerciseDocRef = doc(firestore, "exercises", exerciseId);
        const exerciseDocSnap = await getDoc(exerciseDocRef);

        if (exerciseDocSnap.exists()) {
          setExerciseData(exerciseDocSnap.data());
        } else {
          console.error("No such exercise document!");
        }
        if (user) {
          const statsQuery = query(
            collection(firestore, "exerciseStats"),
            where("exerciseId", "==", exerciseId),
            where("userId", "==", user.uid)
          );
          const statsQuerySnapshot = await getDocs(statsQuery);
          const stats = statsQuerySnapshot.docs.map((doc) => doc.data());
          setStatsData(stats);
        }
      } catch (error) {
        console.error("Error fetching exercise data: ", error);
      }
    };

    fetchExerciseData();
  }, [exerciseId]);

  if (!exerciseData) {
    return <Typography>Loading...</Typography>;
  }

  // Prepare data for the line graph
  const groupedData = statsData.reduce((acc, entry) => {
    const date = new Date(entry.date).toLocaleDateString();
    if (!acc[date] || entry.metric > acc[date].metric) {
      acc[date] = entry;
    }
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedData).sort((a, b) => {
    const dateA = new Date(a.split("/").reverse().join("-"));
    const dateB = new Date(b.split("/").reverse().join("-"));
    return dateA - dateB;
  });

  const data = {
    labels: sortedDates,
    datasets: [
      {
        label: "Metric (Weight x reps)",
        data: sortedDates.map((date) => groupedData[date].metric),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        yAxisID: "y-axis-metric", // Assign the metric data to a specific Y-axis
        cubicInterpolationMode: "monotone", // Smooth out the line
      },
      {
        label: "Est 1 Rep Max",
        data: sortedDates.map((date) =>
          Math.round(
            groupedData[date].weight * (36 / (37 - groupedData[date].reps))
          )
        ),
        fill: false,
        borderColor: "rgb(255, 153, 255, 1)",
        yAxisID: "y-axis-weight", // Assign the weight data to another Y-axis
        cubicInterpolationMode: "monotone", // Smooth out the line
      },
    ],
  };

  const options = {
    scales: {
      yAxes: [
        {
          id: "y-axis-metric",
          type: "linear",
          position: "left",
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: "Metric (Weight x reps)",
          },
        },
        {
          id: "y-axis-weight",
          type: "linear",
          position: "right",
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: "Max Weight (kg)",
          },
        },
      ],
    },
  };

  return (
    <Box
      sx={{ width: "100%", height: "100%", padding: 2, position: "relative" }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Exercise Detail Section (Sticky Header) */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          zIndex: 100,
          paddingBottom: 2,
        }}
      >
        <Grid container spacing={1}>
          <Grid item xs={3}>
            <img
              src={`../${exerciseData.imageUrl}`}
              alt={exerciseData.name}
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </Grid>
          <Grid item xs={9}>
            <Typography variant="h4" gutterBottom>
              {exerciseData.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {exerciseData.muscleGroup}
            </Typography>
            <Typography
              dangerouslySetInnerHTML={{ __html: exerciseData.description }}
            ></Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Graph Section */}
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Progress Over Time
        </Typography>
        <Line data={data} options={options} />
      </Box>

      {/* Historical Data Section (Scrollable Content) */}
      <Box sx={{ maxHeight: "400px", overflowY: "auto", marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Historical Data
        </Typography>
        {sortedDates
          .slice()
          .reverse()
          .map((date) => (
            <Box key={date} sx={{ marginBottom: 3 }}>
              <Typography variant="subtitle1">{date}</Typography>
              {statsData
                .filter(
                  (entry) => new Date(entry.date).toLocaleDateString() === date
                )
                .sort((a, b) => a.setNumber - b.setNumber) // Sort by setNumber
                .map((entry, idx) => (
                  <Box key={idx} sx={{ paddingLeft: 2 }}>
                    <Typography variant="body2">{`Set ${entry.setNumber}: ${entry.reps} x ${entry.weight} kg`}</Typography>
                  </Box>
                ))}
              <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default ExerciseDetail;
