import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// ✅ Register required Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const ExerciseGraph = ({ exerciseData }) => {
  if (!exerciseData || exerciseData.length === 0) {
    return <p>No data available</p>;
  }

  const data = {
    labels: exerciseData.map((entry) =>
      new Date(entry.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Metric (Weight x reps)",
        data: exerciseData.map((entry) => entry.metric),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        cubicInterpolationMode: "monotone",
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        type: "category", // ✅ Fix: Ensure the x-axis is recognized
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Metric (Weight x reps)",
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default ExerciseGraph;
