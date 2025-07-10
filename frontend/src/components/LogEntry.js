import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LogEntry() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [action, setAction] = useState('ENTRY');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await axios.get('http://localhost:8000/api/vehicles/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(res.data);
      } catch (err) {
        console.error('Error fetching vehicles', err);
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      await axios.post('http://localhost:8000/api/log-entry/', {
        vehicle_id: vehicleId,
        action: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${action} logged for vehicle ${vehicleId}`);
    } catch (err) {
      console.log('Error:', err.response?.data);
      setMessage('❌ Error: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h2>Log Vehicle Entry/Exit</h2>
      <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
        <option value="">Select Vehicle</option>
        {vehicles.map(vehicle => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.license_plate || vehicle.vin}
          </option>
        ))}
      </select>
      <select value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="ENTRY">ENTRY</option>
        <option value="EXIT">EXIT</option>
      </select>
      <br />
      <button onClick={handleSubmit}>Log</button>
      <p>{message}</p>
    </div>
  );
}

export default LogEntry;
