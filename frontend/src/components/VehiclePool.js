import React, { useEffect, useState } from 'react';
import axios from 'axios';

const VehiclePool = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/vehicles/available/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    })
    .then(res => setVehicles(res.data));
  }, []);

  const handleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(v => v !== id) : [...selected, id]);
  };

  const handleClaim = () => {
    axios.post('http://localhost:8000/api/vehicles/claim/', { vehicle_ids: selected }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    })
    .then(res => setMessage(`Claimed ${res.data.claimed} vehicles!`))
    .catch(() => setMessage('Failed to claim vehicles'));
  };

  return (
    <div>
      <h2>Available Vehicles</h2>
      {message && <p>{message}</p>}
      <ul>
        {vehicles.map(v => (
          <li key={v.id}>
            <input type="checkbox" checked={selected.includes(v.id)} onChange={() => handleSelect(v.id)} />
            {v.license_plate} — {v.model}
          </li>
        ))}
      </ul>
      <button onClick={handleClaim} disabled={!selected.length}>Claim Selected Vehicles</button>
    </div>
  );
};

export default VehiclePool;
