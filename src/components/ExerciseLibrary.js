// src/components/ExerciseLibrary.js
import React, { useState } from 'react';

const exercises = [
  { name: 'Bench Press', muscleGroup: 'Chest', imageUrl: '...', videoUrl: '...' },
  // More exercises
];

const ExerciseLibrary = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filter || exercise.muscleGroup === filter)
  );

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Exercises" />
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All</option>
        <option value="Chest">Chest</option>
        {/* More options */}
      </select>
      <div>
        {filteredExercises.map((exercise, index) => (
          <div key={index}>
            <h3>{exercise.name}</h3>
            <img src={exercise.imageUrl} alt={exercise.name} />
            <video src={exercise.videoUrl} controls />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
