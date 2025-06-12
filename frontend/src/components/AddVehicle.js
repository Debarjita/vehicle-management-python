// src/AddVehicle.js
import React, { useState } from 'react';
import axios from 'axios';

function AddVehicle() {
  const [vin, setVin] = useState('');
  const [org, setOrg] = useState('');
  const [message, setMessage] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');


  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
         await axios.post(
        'http://localhost:8000/api/vehicles/',
        { vin, org, make, model, year, mileage },
        { headers: { Authorization: `Token ${token}` } }
      );
      setMessage('Vehicle added successfully');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || 'Something went wrong'));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Vehicle</h2>
      <input placeholder="VIN" value={vin} onChange={e => setVin(e.target.value)} /><br />
      <input placeholder="Organization" value={org} onChange={e => setOrg(e.target.value)} /><br />
      <input placeholder="Make" value={make} onChange={e => setMake(e.target.value)} /><br />
      <input placeholder="Model" value={model} onChange={e => setModel(e.target.value)} /><br />
      <input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} /><br />
      <input placeholder="Mileage" value={mileage} onChange={e => setMileage(e.target.value)} /><br />

      <button onClick={handleSubmit}>Add Vehicle</button>
      <p>{message}</p>
    </div>
  );
}

export default AddVehicle;
