import React, { useState } from 'react';
import axios from 'axios';

function VinDecode() {
  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState(null);

  const handleDecode = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:8000/api/decode-vin/${vin}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setDecoded(res.data);
    } catch (err) {
      setDecoded({ error: err.response?.data?.error || 'Failed to decode VIN' });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>VIN Decoder</h2>
      <input placeholder="Enter VIN" value={vin} onChange={e => setVin(e.target.value)} />
      <button onClick={handleDecode}>Decode</button>

      {decoded && (
        <div style={{ marginTop: 10 }}>
          {decoded.error ? (
            <p style={{ color: 'red' }}>{decoded.error}</p>
          ) : (
            <ul>
              <li><strong>VIN:</strong> {decoded.vin}</li>
              <li><strong>Make:</strong> {decoded.make}</li>
              <li><strong>Model:</strong> {decoded.model}</li>
              <li><strong>Year:</strong> {decoded.year}</li>
              <li><strong>Manufacturer:</strong> {decoded.manufacturer}</li>
              <li><strong>Horsepower:</strong> {decoded.horsepower}</li>
              </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default VinDecode;
