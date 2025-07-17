// frontend/src/components/VehicleScanner.js
import React, { useState, useEffect } from 'react';
import LicensePlateScanner from './LicensePlateScanner';

const VehicleScanner = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [entryType, setEntryType] = useState('ENTRY');
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
    loadScanLogs();
  }, []);

  const loadVehicles = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/my-org-vehicles/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadScanLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/ai/license-plate-logs/?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScanLogs(data);
      }
    } catch (error) {
      console.error('Error loading scan logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = (result) => {
    if (result.detected) {
      loadScanLogs(); // Refresh logs
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#495057' }}>Vehicle License Plate Scanner</h2>
      
      {/* Scanner Controls */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '10px' 
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Entry Type:
            </label>
            <select 
              value={entryType} 
              onChange={(e) => setEntryType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="ENTRY">Entry</option>
              <option value="EXIT">Exit</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Expected Vehicle (Optional):
            </label>
            <select 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
            >
              <option value="">Auto-detect from plate</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* License Plate Scanner */}
      <LicensePlateScanner 
        entryType={entryType}
        vehicleId={selectedVehicle || null}
        onScanComplete={handleScanComplete}
      />

      {/* Recent Scan Logs */}
      <div style={{ marginTop: '30px' }}>
        <h3>Recent License Plate Scans (Last 7 Days)</h3>
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {scanLogs.length === 0 ? (
              <p>No scan records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Detected Plate</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Confidence</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Type</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Vehicle Match</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Scanned By</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {scanLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        <strong>{log.detected_plate}</strong>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{log.confidence}%</td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          backgroundColor: log.entry_type === 'ENTRY' ? '#d4edda' : '#fff3cd',
                          color: log.entry_type === 'ENTRY' ? '#155724' : '#856404'
                        }}>
                          {log.entry_type}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {log.vehicle ? (
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{log.vehicle.license_plate}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {log.vehicle.make} {log.vehicle.model}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#dc3545' }}>No match</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{log.scanned_by}</td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default VehicleScanner;
