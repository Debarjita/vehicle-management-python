// frontend/src/components/VehicleList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8000/api/vehicles/vehicles/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Handle different response formats
        const vehicleData = res.data;
        if (Array.isArray(vehicleData)) {
          setVehicles(vehicleData);
        } else if (vehicleData.results && Array.isArray(vehicleData.results)) {
          setVehicles(vehicleData.results);
        } else {
          console.log('Unexpected response format:', vehicleData);
          setVehicles([]);
          setError('Unexpected response format from server');
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError('Failed to fetch vehicles: ' + (err.response?.data?.error || err.message));
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Vehicle List</h2>
        <p>Loading vehicles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Vehicle List</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Vehicle List ({vehicles.length} vehicles)</h2>
      
      {vehicles.length === 0 ? (
        <p style={{ color: '#666' }}>No vehicles found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 15, marginTop: 20 }}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} style={{ 
              border: '1px solid #ddd', 
              padding: 15, 
              borderRadius: 5,
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    {vehicle.license_plate || 'No License Plate'} - {vehicle.make} {vehicle.model}
                  </h4>
                  <p><strong>VIN:</strong> {vehicle.vin}</p>
                  {vehicle.year && <p><strong>Year:</strong> {vehicle.year}</p>}
                  {vehicle.mileage && <p><strong>Mileage:</strong> {vehicle.mileage.toLocaleString()} miles</p>}
                  {vehicle.org && <p><strong>Organization:</strong> {vehicle.org}</p>}
                  {vehicle.status && <p><strong>Status:</strong> {vehicle.status}</p>}
                  {vehicle.assigned_driver && <p><strong>Assigned Driver:</strong> {vehicle.assigned_driver}</p>}
                </div>
                <div style={{ 
                  padding: '5px 10px', 
                  backgroundColor: vehicle.status === 'AVAILABLE' ? '#d4edda' : '#fff3cd',
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {vehicle.status || 'AVAILABLE'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleList;