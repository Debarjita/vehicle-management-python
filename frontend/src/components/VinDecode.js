// frontend/src/components/VinDecode.js
import React, { useState } from 'react';
import axios from 'axios';

function VinDecode() {
  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDecode = async () => {
    if (!vin || vin.length !== 17) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    setLoading(true);
    setError('');
    setDecoded(null);

    const token = localStorage.getItem('accessToken');
    
    try {
      const response = await axios.get(`http://localhost:8000/api/decode-vin/${vin}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDecoded(response.data);
      setError('');
      
    } catch (err) {
      console.error('VIN decode error:', err);
      setDecoded(null);
      setError(err.response?.data?.error || 'Failed to decode VIN');
    } finally {
      setLoading(false);
    }
  };

  const handleTestVin = () => {
    setVin('TEST123456789ABCD');
  };

  const handleClearAll = () => {
    setVin('');
    setDecoded(null);
    setError('');
  };

  return (
    <div style={{ padding: 20, maxWidth: 800 }}>
      <h2>VIN Decoder</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Enter a 17-character Vehicle Identification Number (VIN) to decode vehicle information.
      </p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input 
            placeholder="Enter 17-character VIN (e.g., 1HGBH41JXMN109186)" 
            value={vin} 
            onChange={e => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            style={{ 
              flex: 1, 
              padding: 10, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              fontSize: 14,
              fontFamily: 'monospace'
            }}
          />
          <button 
            onClick={handleDecode}
            disabled={loading || !vin || vin.length !== 17}
            style={{ 
              padding: 10, 
              backgroundColor: loading || !vin || vin.length !== 17 ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: 4,
              cursor: loading || !vin || vin.length !== 17 ? 'not-allowed' : 'pointer',
              minWidth: 100
            }}
          >
            {loading ? 'Decoding...' : 'Decode VIN'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={handleTestVin}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Use Test VIN
          </button>
          <button 
            onClick={handleClearAll}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Clear All
          </button>
        </div>

        {vin && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            Characters: {vin.length}/17 {vin.length === 17 ? '✅' : '❌'}
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          padding: 15, 
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid #ffcdd2'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>❌ Error</h4>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {decoded && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#e8f5e8',
          borderRadius: 4,
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>✅ VIN Decoded Successfully</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Basic Information</h4>
              <div style={{ fontSize: 14 }}>
                <div style={{ marginBottom: 5 }}><strong>VIN:</strong> {decoded.vin}</div>
                <div style={{ marginBottom: 5 }}><strong>Make:</strong> {decoded.make || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Model:</strong> {decoded.model || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Year:</strong> {decoded.year || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Manufacturer:</strong> {decoded.manufacturer || 'Not available'}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Technical Details</h4>
              <div style={{ fontSize: 14 }}>
                <div style={{ marginBottom: 5 }}><strong>Body Class:</strong> {decoded.body_class || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Vehicle Type:</strong> {decoded.vehicle_type || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Engine HP:</strong> {decoded.engine_hp || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Fuel Type:</strong> {decoded.fuel_type || 'Not available'}</div>
                <div style={{ marginBottom: 5 }}><strong>Transmission:</strong> {decoded.transmission || 'Not available'}</div>
              </div>
            </div>
          </div>

          {decoded.api_error_code && decoded.api_error_code !== "0" && (
            <div style={{ 
              marginTop: 15, 
              padding: 10, 
              backgroundColor: '#fff3cd',
              color: '#856404',
              borderRadius: 4,
              border: '1px solid #ffeaa7'
            }}>
              <strong>⚠️ API Warning:</strong> {decoded.api_error_text || 'Some data may be incomplete'}
            </div>
          )}

          {decoded.api_status === "test_data" && (
            <div style={{ 
              marginTop: 15, 
              padding: 10, 
              backgroundColor: '#d1ecf1',
              color: '#0c5460',
              borderRadius: 4,
              border: '1px solid #bee5eb'
            }}>
              <strong>ℹ️ Test Data:</strong> This is sample data for testing purposes
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
        <h4 style={{ margin: '0 0 10px 0' }}>VIN Decode Information:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#666' }}>
          <li>VIN must be exactly 17 characters long</li>
          <li>Uses NHTSA (National Highway Traffic Safety Administration) database</li>
          <li>Some older or specialty vehicles may have limited data</li>
          <li>Results are cached for faster subsequent lookups</li>
          <li>Click "Use Test VIN" to see a working example</li>
        </ul>
      </div>
    </div>
  );
}

export default VinDecode;