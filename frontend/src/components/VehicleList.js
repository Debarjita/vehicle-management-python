// src/components/VehicleList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      const token = localStorage.getItem('accessToken'); // <--- Use the actual key you use for login!
      try {
        const res = await axios.get('http://localhost:8000/api/vehicles/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setVehicles(res.data);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        console.log('vehicles:', vehicles);

      }
    };
    fetchVehicles();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Vehicle List</h2>
      <ul>
        {vehicles.map((v) => (
          <li key={v.id}>
            VIN: {v.vin}, Org: {v.org}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VehicleList;
