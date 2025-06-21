// frontend/src/components/AdminVehicleOverview.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const AdminVehicleOverview = () => {
  const [allVehicles, setAllVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [claimedVehicles, setClaimedVehicles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all vehicles
      const vehiclesRes = await axios.get('http://localhost:8000/api/vehicles/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load available vehicles
      const availableRes = await axios.get('http://localhost:8000/api/available/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load organizations
      const orgsRes = await axios.get('http://localhost:8000/api/orgs-list/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const vehicles = vehiclesRes.data || [];
      const available = availableRes.data || [];
      const orgs = orgsRes.data || [];
      
      setAllVehicles(vehicles);
      setAvailableVehicles(available);
      setClaimedVehicles(vehicles.filter(v => v.org));
      setOrganizations(orgs);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Failed to load vehicle data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Unknown Organization';
  };

  const groupVehiclesByOrg = () => {
    const grouped = {};
    claimedVehicles.forEach(vehicle => {
      const orgName = vehicle.org ? getOrgName(vehicle.org) : 'No Organization';
      if (!grouped[orgName]) {
        grouped[orgName] = [];
      }
      grouped[orgName].push(vehicle);
    });
    return grouped;
  };

  const renderOverview = () => {
    const groupedVehicles = groupVehiclesByOrg();
    const orgCount = Object.keys(groupedVehicles).length;
    
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
          <div style={{ padding: 20, backgroundColor: '#e3f2fd', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#1565c0' }}>{allVehicles.length}</h3>
            <p style={{ margin: 0, color: '#666' }}>Total Vehicles</p>
          </div>
          <div style={{ padding: 20, backgroundColor: '#e8f5e8', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#2e7d32' }}>{availableVehicles.length}</h3>
            <p style={{ margin: 0, color: '#666' }}>Available</p>
          </div>
          <div style={{ padding: 20, backgroundColor: '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#f57c00' }}>{claimedVehicles.length}</h3>
            <p style={{ margin: 0, color: '#666' }}>Claimed</p>
          </div>
          <div style={{ padding: 20, backgroundColor: '#fce4ec', borderRadius: 8, textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#c2185b' }}>{orgCount}</h3>
            <p style={{ margin: 0, color: '#666' }}>Organizations</p>
          </div>
        </div>

        <h3>Vehicles by Organization</h3>
        {Object.keys(groupedVehicles).length === 0 ? (
          <p style={{ color: '#666' }}>No vehicles have been claimed yet.</p>
        ) : (
          Object.entries(groupedVehicles).map(([orgName, vehicles]) => (
            <div key={orgName} style={{ marginBottom: 20, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <h4 style={{ margin: 0 }}>{orgName} ({vehicles.length} vehicles)</h4>
              </div>
              <div style={{ padding: 15 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 10,
                      backgroundColor: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 4
                    }}>
                      <div>
                        <strong>{vehicle.license_plate || 'No Plate'}</strong> - {vehicle.make} {vehicle.model}
                        <br />
                        <small style={{ color: '#666' }}>VIN: {vehicle.vin}</small>
                      </div>
                      <div style={{ 
                        padding: '4px 8px', 
                        backgroundColor: vehicle.status === 'AVAILABLE' ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: 3,
                        fontSize: 12
                      }}>
                        {vehicle.status || 'ASSIGNED'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderAvailableVehicles = () => (
    <div>
      <h3>Available Vehicles ({availableVehicles.length})</h3>
      {availableVehicles.length === 0 ? (
        <p style={{ color: '#666' }}>No vehicles available for claiming.</p>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {availableVehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              padding: 15,
              border: '1px solid #ddd',
              borderRadius: 4,
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{vehicle.license_plate || 'No License Plate'}</strong> - {vehicle.make} {vehicle.model}
                  <br />
                  <small style={{ color: '#666' }}>
                    VIN: {vehicle.vin}
                    {vehicle.year && ` | Year: ${vehicle.year}`}
                    {vehicle.mileage && ` | Mileage: ${vehicle.mileage.toLocaleString()}`}
                  </small>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAllVehicles = () => (
    <div>
      <h3>All Vehicles ({allVehicles.length})</h3>
      <div style={{ display: 'grid', gap: 15 }}>
        {allVehicles.map(vehicle => (
          <div key={vehicle.id} style={{ 
            padding: 15,
            border: '1px solid #ddd',
            borderRadius: 4,
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{vehicle.license_plate || 'No License Plate'}</strong> - {vehicle.make} {vehicle.model}
                <br />
                <small style={{ color: '#666' }}>
                  VIN: {vehicle.vin}
                  {vehicle.year && ` | Year: ${vehicle.year}`}
                  {vehicle.org && ` | Org: ${getOrgName(vehicle.org)}`}
                </small>
              </div>
              <div style={{ 
                padding: '4px 8px', 
                backgroundColor: vehicle.org ? '#6c757d' : '#28a745',
                color: 'white',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {vehicle.org ? 'CLAIMED' : 'AVAILABLE'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Vehicle Overview</h2>
        <p>Loading vehicle data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Vehicle Management</h2>
      
      {message && (
        <div style={{ 
          padding: 10, 
          margin: '10px 0', 
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: 4 
        }}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'available', label: 'Available' },
          { key: 'all', label: 'All Vehicles' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #007bff' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? '#007bff' : '#666',
              cursor: 'pointer',
              marginRight: 10
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'available' && renderAvailableVehicles()}
      {activeTab === 'all' && renderAllVehicles()}
    </div>
  );
};

export default AdminVehicleOverview;