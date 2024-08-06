// src/components/Equipment.js
import React from 'react';

const Equipment = ({ equipment }) => (
  <div>
    <h2>Required Equipment:</h2>
    <ul>
      {equipment.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
);

export default Equipment;
