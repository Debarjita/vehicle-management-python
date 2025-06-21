// frontend/src/components/OrgManagerDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function OrgManagerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [guards, setGuards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  
  // Forms
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'GUARD' });
  const [assignForm, setAssignForm] = useState({ driver_id: '', vehicle_id: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const token = localStorage.getItem('accessToken');

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicles/org-dashboard/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard data error:', error);
    }
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicles/my-org-users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsers = response.data || [];
      setDrivers(allUsers.filter(u => u.role === 'DRIVER'));
      setGuards(allUsers.filter(u => u.role === 'GUARD'));
    } catch (error) {
      console.error('Users loading error:', error);
    }
  }, [token]);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicles/my-org-vehicles/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Vehicles loading error:', error);
    }
  }, [token]);

  const loadAvailableVehicles = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vehicles/available/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableVehicles(response.data || []);
    } catch (error) {
      console.error('Available vehicles error:', error);
    }
  }, [token]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardData(),
        loadUsers(),
        loadVehicles(),
        loadAvailableVehicles()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('❌ Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData, loadUsers, loadVehicles, loadAvailableVehicles]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const createUser = async () => {
    if (!userForm.username || !userForm.password) {
      setMessage('❌ Please fill in username and password');
      return;
    }

    setCreateUserLoading(true);
    try {
      await axios.post('http://localhost:8000/api/vehicles/create-guard-driver/', userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${userForm.role} "${userForm.username}" created successfully!`);
      setUserForm({ username: '', password: '', role: 'GUARD' });
      
      // Reload users and dashboard data
      await loadUsers();
      await loadDashboardData();
      
    } catch (error) {
      console.error('Create user error:', error);
      setMessage('❌ Error creating user: ' + (error.response?.data?.error || error.message));
    } finally {
      setCreateUserLoading(false);
    }
  };

  const claimVehicles = async () => {
    if (selectedVehicles.length === 0) {
      setMessage('❌ Please select vehicles to claim');
      return;
    }
    
    setClaimLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/vehicles/claim/', 
        { vehicle_ids: selectedVehicles }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.claimed > 0) {
        setMessage(`✅ Successfully claimed ${response.data.claimed} vehicle(s)!`);
        setSelectedVehicles([]);
        // Reload all data
        await loadVehicles();
        await loadAvailableVehicles();
        await loadDashboardData();
      } else {
        setMessage('❌ No vehicles were claimed: ' + (response.data.errors?.join(', ') || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Claim vehicles error:', error);
      setMessage('❌ Error claiming vehicles: ' + (error.response?.data?.error || error.message));
    } finally {
      setClaimLoading(false);
    }
  };

  const assignDriver = async () => {
    if (!assignForm.driver_id || !assignForm.vehicle_id) {
      setMessage('❌ Please select both driver and vehicle');
      return;
    }

    setAssignLoading(true);
    try {
      await axios.post('http://localhost:8000/api/vehicles/assign-driver/', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Driver assigned successfully!');
      setAssignForm({ driver_id: '', vehicle_id: '' });
      
      // Reload vehicles data
      await loadVehicles();
      
    } catch (error) {
      console.error('Assign driver error:', error);
      setMessage('❌ Error assigning driver: ' + (error.response?.data?.error || error.message));
    } finally {
      setAssignLoading(false);
    }
  };

  const generateSchedules = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/vehicles/generate-schedules/', 
        { date: new Date().toISOString().split('T')[0] }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage(`✅ Schedules generated! ${response.data.guard_shifts} guard shifts, ${response.data.driver_shifts} driver shifts`);
      
      // Reload dashboard data
      await loadDashboardData();
      
    } catch (error) {
      console.error('Generate schedules error:', error);
      setMessage('❌ Error generating schedules: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSelectAllVehicles = () => {
    if (selectedVehicles.length === availableVehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(availableVehicles.map(v => v.id));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Organization Manager Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 20, 
            height: 20, 
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Organization Manager Dashboard</h2>
      
      {message && (
        <div style={{ 
          padding: 12, 
          margin: '15px 0', 
          backgroundColor: message.includes('❌') ? '#ffebee' : '#e8f5e8',
          color: message.includes('❌') ? '#c62828' : '#2e7d32',
          borderRadius: 6,
          border: `1px solid ${message.includes('❌') ? '#ffcdd2' : '#c8e6c9'}`
        }}>
          {message}
        </div>
      )}

      {/* Dashboard Stats */}
      {dashboardData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
          <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#e8f5e8', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#2e7d32', fontSize: 28 }}>{dashboardData.total_guards || 0}</h3>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Guards</p>
          </div>
          <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#e3f2fd', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#1565c0', fontSize: 28 }}>{dashboardData.total_drivers || 0}</h3>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Drivers</p>
          </div>
          <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f3e5f5', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#7b1fa2', fontSize: 28 }}>{dashboardData.total_vehicles || 0}</h3>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Vehicles</p>
          </div>
          <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff3e0', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#ef6c00', fontSize: 28 }}>{dashboardData.todays_attendance || 0}</h3>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Today's Attendance</p>
          </div>
        </div>
      )}

      {/* Create User Section */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Create Guard/Driver</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Username:</label>
            <input 
              placeholder="Enter username" 
              value={userForm.username} 
              onChange={e => setUserForm({...userForm, username: e.target.value})}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Password:</label>
            <input 
              type="password"
              placeholder="Enter password" 
              value={userForm.password} 
              onChange={e => setUserForm({...userForm, password: e.target.value})}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Role:</label>
            <select 
              value={userForm.role} 
              onChange={e => setUserForm({...userForm, role: e.target.value})}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="GUARD">Guard</option>
              <option value="DRIVER">Driver</option>
            </select>
          </div>
          <button 
            onClick={createUser} 
            disabled={createUserLoading || !userForm.username || !userForm.password}
            style={{ 
              padding: 10, 
              backgroundColor: createUserLoading || !userForm.username || !userForm.password ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4,
              cursor: createUserLoading || !userForm.username || !userForm.password ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {createUserLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>

      {/* Available Vehicles to Claim */}
      {availableVehicles.length > 0 && (
        <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ margin: 0 }}>Available Vehicles ({availableVehicles.length})</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={handleSelectAllVehicles}
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                {selectedVehicles.length === availableVehicles.length ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                onClick={claimVehicles} 
                disabled={selectedVehicles.length === 0 || claimLoading}
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: selectedVehicles.length > 0 && !claimLoading ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedVehicles.length > 0 && !claimLoading ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {claimLoading ? 'Claiming...' : `Claim Selected (${selectedVehicles.length})`}
              </button>
            </div>
          </div>
          
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
            {availableVehicles.map(vehicle => (
              <div key={vehicle.id} style={{ 
                padding: 12, 
                borderBottom: '1px solid #eee',
                backgroundColor: selectedVehicles.includes(vehicle.id) ? '#e7f3ff' : '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedVehicles.includes(vehicle.id)}
                    onChange={() => handleVehicleSelect(vehicle.id)}
                    style={{ marginRight: 12 }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 2 }}>
                      {vehicle.license_plate || 'No Plate'} - {vehicle.make} {vehicle.model}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      VIN: {vehicle.vin}
                      {vehicle.year && ` | Year: ${vehicle.year}`}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organization Vehicles */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Organization Vehicles ({vehicles.length})</h3>
        {vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <p>No vehicles claimed yet.</p>
            <p>Claim some vehicles from the available pool above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {vehicles.map(vehicle => (
              <div key={vehicle.id} style={{ 
                padding: 15,
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: 6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {vehicle.license_plate || 'No Plate'} - {vehicle.make} {vehicle.model}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      VIN: {vehicle.vin} | Status: {vehicle.status || 'ASSIGNED'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      padding: '4px 8px', 
                      backgroundColor: vehicle.assigned_driver ? '#28a745' : '#ffc107',
                      color: vehicle.assigned_driver ? 'white' : 'black',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {vehicle.assigned_driver || 'No Driver Assigned'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Driver to Vehicle */}
      {drivers.length > 0 && vehicles.length > 0 && (
        <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Assign Driver to Vehicle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Select Driver:</label>
              <select 
                value={assignForm.driver_id} 
                onChange={e => setAssignForm({...assignForm, driver_id: e.target.value})}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              >
                <option value="">Choose Driver...</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Select Vehicle:</label>
              <select 
                value={assignForm.vehicle_id} 
                onChange={e => setAssignForm({...assignForm, vehicle_id: e.target.value})}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              >
                <option value="">Choose Vehicle...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate || vehicle.vin} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={assignDriver}
              disabled={!assignForm.driver_id || !assignForm.vehicle_id || assignLoading}
              style={{ 
                padding: 10, 
                backgroundColor: assignForm.driver_id && assignForm.vehicle_id && !assignLoading ? '#007bff' : '#ccc', 
                color: 'white', 
                border: 'none',
                borderRadius: 4,
                cursor: assignForm.driver_id && assignForm.vehicle_id && !assignLoading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {assignLoading ? 'Assigning...' : 'Assign Driver'}
            </button>
          </div>
        </div>
      )}

      {/* Users Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 30 }}>
        {/* Guards */}
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#28a745' }}>Guards ({guards.length})</h4>
          {guards.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>No guards created yet. Create some using the form above.</p>
          ) : (
            <div>
              {guards.map(guard => (
                <div key={guard.id} style={{ 
                  padding: 10, 
                  marginBottom: 8, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 4,
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{guard.username}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>ID: {guard.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drivers */}
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Drivers ({drivers.length})</h4>
          {drivers.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>No drivers created yet. Create some using the form above.</p>
          ) : (
            <div>
              {drivers.map(driver => (
                <div key={driver.id} style={{ 
                  padding: 10, 
                  marginBottom: 8, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 4,
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{driver.username}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>ID: {driver.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Schedules */}
      <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Schedule Management</h3>
        <p style={{ color: '#666', marginBottom: 15 }}>
          Generate today's schedules for all guards and drivers in your organization.
        </p>
        <button 
          onClick={generateSchedules}
          style={{ 
            padding: 12, 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none',
            borderRadius: 4,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Generate Today's Schedules
        </button>
      </div>

      {/* Refresh Data Button */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button 
          onClick={loadAllData}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#6c757d', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh All Data'}
        </button>
      </div>
    </div>
  );
}

export default OrgManagerDashboard;