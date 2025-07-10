// frontend/src/components/VehiclePool.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const VehiclePool = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');

  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');

  const loadAvailableVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/available/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Available vehicles response:', response.data);
      setVehicles(response.data || []);
      
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setMessage('Failed to load available vehicles: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadOrganizations = useCallback(async () => {
    if (userRole === 'ADMIN') {
      try {
        const response = await axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Flatten nested organizations
        const flatOrgs = [];
        const flatten = (nodes) => {
          nodes.forEach(node => {
            flatOrgs.push({ id: node.id, name: node.name });
            if (node.children) flatten(node.children);
          });
        };
        flatten(response.data || []);
        setOrganizations(flatOrgs);
        
      } catch (error) {
        console.error('Error loading organizations:', error);
      }
    }
  }, [token, userRole]);

  useEffect(() => {
    loadAvailableVehicles();
    loadOrganizations();
  }, [loadAvailableVehicles, loadOrganizations]);

  const handleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(vehicleId => vehicleId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === vehicles.length) {
      setSelected([]);
    } else {
      setSelected(vehicles.map(v => v.id));
    }
  };

  const handleClaim = async () => {
    if (selected.length === 0) {
      setMessage('Please select at least one vehicle to claim');
      return;
    }

    // For admin, require organization selection
    if (userRole === 'ADMIN' && !selectedOrg) {
      setMessage('Please select an organization to assign vehicles to');
      return;
    }

    setClaiming(true);
    setMessage('');

    try {
      console.log('Claiming vehicles:', selected);
      
      const requestData = { vehicle_ids: selected };
      if (userRole === 'ADMIN') {
        requestData.org_id = selectedOrg;
      }
      
      const response = await axios.post('http://localhost:8000/api/claim/', 
        requestData, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Claim response:', response.data);
      
      if (response.data.claimed > 0) {
        const orgName = userRole === 'ADMIN' 
          ? organizations.find(o => o.id == selectedOrg)?.name || 'Selected Organization'
          : 'your organization';
        setMessage(`✅ Successfully claimed ${response.data.claimed} vehicle(s) for ${orgName}!`);
        setSelected([]);
        setSelectedOrg('');
        // Reload the available vehicles list
        await loadAvailableVehicles();
      } else {
        setMessage('❌ No vehicles were claimed. ' + (response.data.errors?.join(', ') || ''));
      }
      
    } catch (error) {
      console.error('Claim error:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to claim vehicles';
      setMessage('❌ ' + errorMsg);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Vehicle Pool</h2>
        <p>Loading available vehicles...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{userRole === 'ADMIN' ? 'Vehicle Pool Management' : 'Available Vehicles'}</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        {userRole === 'ADMIN' 
          ? 'Assign vehicles from the available pool to organizations.'
          : 'Select vehicles from the available pool to claim for your organization.'
        }
      </p>

      {message && (
        <div style={{ 
          padding: 10, 
          margin: '10px 0', 
          backgroundColor: message.includes('✅') ? '#e8f5e8' : '#ffebee',
          color: message.includes('✅') ? '#2e7d32' : '#c62828',
          borderRadius: 4 
        }}>
          {message}
        </div>
      )}

      {/* Admin Organization Selection */}
      {userRole === 'ADMIN' && (
        <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#f8f9fa' }}>
          <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold' }}>
            Select Organization (Required for Admin):
          </label>
          <select 
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            style={{ 
              padding: 8, 
              width: '100%',
              maxWidth: 300,
              borderRadius: 4,
              border: '1px solid #ddd'
            }}
          >
            <option value="">Choose Organization...</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>{vehicles.length}</strong> vehicles available</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {vehicles.length > 0 && (
              <button 
                onClick={handleSelectAll}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                {selected.length === vehicles.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            <button 
              onClick={handleClaim} 
              disabled={selected.length === 0 || claiming || (userRole === 'ADMIN' && !selectedOrg)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: selected.length > 0 && !claiming && (userRole !== 'ADMIN' || selectedOrg) ? '#28a745' : '#ccc', 
                color: 'white', 
                border: 'none',
                borderRadius: 4,
                cursor: selected.length > 0 && !claiming && (userRole !== 'ADMIN' || selectedOrg) ? 'pointer' : 'not-allowed'
              }}
            >
              {claiming ? 'Processing...' : `${userRole === 'ADMIN' ? 'Assign' : 'Claim'} Selected (${selected.length})`}
            </button>
          </div>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div style={{ 
          padding: 30, 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa',
          borderRadius: 4,
          color: '#666'
        }}>
          <h3>No vehicles available</h3>
          <p>All vehicles have been claimed by organizations.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: 15, 
          maxHeight: 400, 
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: 15
        }}>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: 15,
              border: selected.includes(vehicle.id) ? '2px solid #007bff' : '1px solid #ddd',
              borderRadius: 4,
              backgroundColor: selected.includes(vehicle.id) ? '#e7f3ff' : '#fff',
              cursor: 'pointer'
            }}
            onClick={() => handleSelect(vehicle.id)}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(vehicle.id)}
                onChange={() => handleSelect(vehicle.id)}
                style={{ marginRight: 15 }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                  {vehicle.license_plate || 'No License Plate'} - {vehicle.make} {vehicle.model}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  <span><strong>VIN:</strong> {vehicle.vin}</span>
                  {vehicle.year && <span style={{ marginLeft: 15 }}><strong>Year:</strong> {vehicle.year}</span>}
                  {vehicle.mileage && <span style={{ marginLeft: 15 }}><strong>Mileage:</strong> {vehicle.mileage.toLocaleString()}</span>}
                </div>
              </div>

              <div style={{ 
                padding: '4px 8px', 
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                AVAILABLE
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <p><strong>Note:</strong> {userRole === 'ADMIN' 
          ? 'As admin, you can assign vehicles to any organization.'
          : 'Once claimed, vehicles will be assigned to your organization and removed from this pool.'
        }</p>
        <p><strong>Selected:</strong> {selected.length} of {vehicles.length} vehicles</p>
      </div>
    </div>
  );
};

export default VehiclePool;