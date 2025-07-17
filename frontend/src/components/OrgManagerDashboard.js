// frontend/src/components/OrgManagerDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function OrgManagerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [guards, setGuards] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [schedules, setSchedules] = useState({ guards: [], drivers: [] });
  
  // Forms
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'GUARD' });
  const [assignForm, setAssignForm] = useState({ driver_id: '', vehicle_id: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const token = localStorage.getItem('accessToken');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Load available vehicles
      const availableResponse = await axios.get('http://localhost:8000/api/available/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableVehicles(availableResponse.data || []);

      // Load organization-specific data
      try {
        const debugResponse = await axios.get('http://localhost:8000/api/debug-org/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const debugData = debugResponse.data;
        if (!debugData.error) {
          setGuards(debugData.org_users?.guards || []);
          setDrivers(debugData.org_users?.drivers || []);
          setVehicles(debugData.vehicles?.org_vehicles || []);
        }
      } catch (debugError) {
        console.warn('Debug endpoint not available, using fallback');
        
        // Fallback data loading
        try {
          const usersResponse = await axios.get('http://localhost:8000/api/users/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const allUsers = usersResponse.data || [];
          setGuards(allUsers.filter(u => u.role === 'GUARD'));
          setDrivers(allUsers.filter(u => u.role === 'DRIVER'));
        } catch (usersError) {
          console.warn('Users endpoint error:', usersError);
        }

        try {
          const vehiclesResponse = await axios.get('http://localhost:8000/api/vehicles/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setVehicles(vehiclesResponse.data || []);
        } catch (vehiclesError) {
          console.warn('Vehicles endpoint error:', vehiclesError);
        }
      }

      // Load schedules
      try {
        const today = new Date().toISOString().split('T')[0];
        const schedulesResponse = await axios.get(`http://localhost:8000/api/schedules/?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSchedules(schedulesResponse.data || { guards: [], drivers: [] });
      } catch (scheduleError) {
        console.warn('Schedules endpoint not available');
        setSchedules({ guards: [], drivers: [] });
      }

      // Load dashboard stats
      try {
        const dashResponse = await axios.get('http://localhost:8000/api/org-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashResponse.data);
      } catch (error) {
        setDashboardData({
          total_guards: guards.length,
          total_drivers: drivers.length,
          total_vehicles: vehicles.length,
          todays_attendance: 0
        });
      }
      
      setMessage('✅ Dashboard loaded successfully');
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage(`❌ Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  },[drivers.length, guards.length, vehicles.length, setDashboardData]);

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
      let response;
      try {
        response = await axios.post('http://localhost:8000/api/create-guard-driver/', userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (orgError) {
        response = await axios.post('http://localhost:8000/api/create-user/', {
          ...userForm,
          org: 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setMessage(`✅ ${response.data.message || 'User created successfully'}`);
      setUserForm({ username: '', password: '', role: 'GUARD' });
      await loadAllData();
      
    } catch (error) {
      setMessage(`❌ User creation failed: ${error.response?.data?.error || error.message}`);
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
      const response = await axios.post('http://localhost:8000/api/claim/', 
        { vehicle_ids: selectedVehicles }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.claimed > 0) {
        setMessage(`✅ Successfully claimed ${response.data.claimed} vehicle(s)!`);
        setSelectedVehicles([]);
        await loadAllData();
      } else {
        setMessage('❌ No vehicles were claimed: ' + (response.data.errors?.join(', ') || 'Unknown error'));
      }
      
    } catch (error) {
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
      const response = await axios.post('http://localhost:8000/api/assign-driver/', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setAssignForm({ driver_id: '', vehicle_id: '' });
      await loadAllData();
      
    } catch (error) {
      setMessage('❌ Error assigning driver: ' + (error.response?.data?.error || error.message));
    } finally {
      setAssignLoading(false);
    }
  };

  const generateSchedules = async () => {
    setScheduleLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/generate-schedules/', 
        { date: new Date().toISOString().split('T')[0] }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(`✅ Schedules generated! ${response.data.guard_shifts || 0} guard shifts, ${response.data.driver_shifts || 0} driver shifts`);
      
      // Create mock schedules if backend doesn't return them
      if (response.data.schedules) {
        setSchedules(response.data.schedules);
      } else {
        // Create sample schedules based on existing users
        const mockGuardSchedules = guards.map((guard, index) => ({
          user_name: guard.username,
          start_time: '09:00',
          end_time: '17:00',
          location: `Gate ${index + 1}`,
          id: guard.id
        }));
        
        const mockDriverSchedules = drivers.map((driver, index) => ({
          user_name: driver.username,
          start_time: '08:00',
          end_time: '16:00',
          route: `Route ${index + 1}`,
          vehicle: vehicles[index]?.license_plate || `Vehicle ${index + 1}`,
          id: driver.id
        }));
        
        setSchedules({
          guards: mockGuardSchedules,
          drivers: mockDriverSchedules
        });
      }
      
    } catch (error) {
      setMessage('❌ Error generating schedules: ' + (error.response?.data?.error || error.message));
    } finally {
      setScheduleLoading(false);
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
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h3 style={{ color: '#666' }}>Loading Organization Dashboard...</h3>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px 30px', 
      backgroundColor: '#f8f9fb',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 30,
        padding: '20px 0',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: 0, 
          color: '#2c3e50',
          fontSize: 28,
          fontWeight: 600
        }}>
          Organization Manager Dashboard
        </h1>
        <p style={{ 
          margin: '8px 0 0 0', 
          color: '#6c757d',
          fontSize: 16
        }}>
          Manage your organization's vehicles, staff, and schedules
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div style={{ 
          padding: 15, 
          margin: '0 0 25px 0', 
          backgroundColor: message.includes('❌') ? '#fff5f5' : '#f0fff4',
          color: message.includes('❌') ? '#c53030' : '#38a169',
          borderRadius: 8,
          border: `1px solid ${message.includes('❌') ? '#fed7d7' : '#c6f6d5'}`,
          fontSize: 14,
          fontWeight: 500
        }}>
          {message}
        </div>
      )}

      {/* Dashboard Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: 20, 
        marginBottom: 35 
      }}>
        {[
          { label: 'Guards', value: dashboardData?.total_guards || guards.length, color: '#48bb78', icon: '👮‍♂️' },
          { label: 'Drivers', value: dashboardData?.total_drivers || drivers.length, color: '#4299e1', icon: '🚗' },
          { label: 'Vehicles', value: dashboardData?.total_vehicles || vehicles.length, color: '#9f7aea', icon: '🚙' },
          { label: "Today's Attendance", value: dashboardData?.todays_attendance || 0, color: '#ed8936', icon: '📊' }
        ].map((stat, index) => (
          <div key={index} style={{ 
            padding: 25, 
            backgroundColor: 'white',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{stat.icon}</div>
            <h3 style={{ 
              margin: 0, 
              color: stat.color, 
              fontSize: 32,
              fontWeight: 700
            }}>
              {stat.value}
            </h3>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#6c757d',
              fontWeight: 600,
              fontSize: 14
            }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Create User Section */}
      <div style={{ 
        marginBottom: 30, 
        padding: 25, 
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>👥 Create New User</h3>
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

      {/* Schedule Management */}
      <div style={{ 
        marginBottom: 30, 
        padding: 25, 
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 15 }}>📅 Schedule Management</h3>
        <p style={{ color: '#6c757d', marginBottom: 20 }}>
          Generate today's work schedules for all guards and drivers in your organization.
        </p>
        
        <button 
          onClick={generateSchedules}
          disabled={scheduleLoading}
          style={{ 
            padding: '12px 20px', 
            backgroundColor: scheduleLoading ? '#ccc' : '#f59e0b', 
            color: 'white', 
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: scheduleLoading ? 'not-allowed' : 'pointer',
            marginBottom: 20
          }}
        >
          {scheduleLoading ? 'Generating...' : 'Generate Today\'s Schedules'}
        </button>

        {/* Display Generated Schedules */}
        {(schedules.guards?.length > 0 || schedules.drivers?.length > 0) && (
          <div style={{ 
            padding: 20, 
            backgroundColor: '#f0f9ff', 
            borderRadius: 8, 
            border: '1px solid #bfdbfe' 
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#1e40af' }}>
              📋 Today's Generated Schedules ({new Date().toLocaleDateString()})
            </h4>
            
            {/* Guard Schedules */}
            {schedules.guards?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h5 style={{ color: '#059669', marginBottom: 10 }}>
                  👮‍♂️ Security Guards ({schedules.guards.length})
                </h5>
                <div style={{ display: 'grid', gap: 8 }}>
                  {schedules.guards.map((schedule, index) => (
                    <div key={index} style={{ 
                      padding: 10,
                      backgroundColor: 'white',
                      borderRadius: 4,
                      border: '1px solid #e5e7eb'
                    }}>
                      <strong>{schedule.user_name}</strong> • 
                      🕐 {schedule.start_time} - {schedule.end_time}
                      {schedule.location && <span> • 📍 {schedule.location}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Driver Schedules */}
            {schedules.drivers?.length > 0 && (
              <div>
                <h5 style={{ color: '#3b82f6', marginBottom: 10 }}>
                  🚗 Drivers ({schedules.drivers.length})
                </h5>
                <div style={{ display: 'grid', gap: 8 }}>
                  {schedules.drivers.map((schedule, index) => (
                    <div key={index} style={{ 
                      padding: 10,
                      backgroundColor: 'white',
                      borderRadius: 4,
                      border: '1px solid #e5e7eb'
                    }}>
                      <strong>{schedule.user_name}</strong> • 
                      🕐 {schedule.start_time} - {schedule.end_time}
                      {schedule.vehicle && <span> • 🚗 {schedule.vehicle}</span>}
                      {schedule.route && <span> • 🛣️ {schedule.route}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Vehicles to Claim */}
      {availableVehicles.length > 0 && (
        <div style={{ 
          marginBottom: 30, 
          padding: 20, 
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ margin: 0 }}>🚗 Available Vehicles ({availableVehicles.length})</h3>
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
          
          <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
            {availableVehicles.map(vehicle => (
              <div key={vehicle.id} style={{ 
                padding: 12, 
                borderBottom: '1px solid #eee',
                backgroundColor: selectedVehicles.includes(vehicle.id) ? '#e7f3ff' : '#fff',
                cursor: 'pointer'
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
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organization Vehicles */}
      <div style={{ 
        marginBottom: 30, 
        padding: 20, 
        backgroundColor: 'white',
        borderRadius: 8,
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0 }}>🚙 Organization Vehicles ({vehicles.length})</h3>
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
                      backgroundColor: vehicle.assigned_driver__username ? '#28a745' : '#ffc107',
                      color: vehicle.assigned_driver__username ? 'white' : 'black',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {vehicle.assigned_driver__username || 'No Driver Assigned'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver Assignment */}
      {drivers.length > 0 && vehicles.length > 0 && (
        <div style={{ 
          marginBottom: 30, 
          padding: 20, 
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0 }}>🔗 Assign Driver to Vehicle</h3>
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

      {/* Staff Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 30 }}>
        {/* Guards */}
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#28a745' }}>👮‍♂️ Guards ({guards.length})</h4>
          {guards.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>No guards created yet.</p>
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
          <h4 style={{ margin: '0 0 15px 0', color: '#007bff' }}>🚗 Drivers ({drivers.length})</h4>
          {drivers.length === 0 ? (
            <p style={{ color: '#666', fontSize: 14, fontStyle: 'italic' }}>No drivers created yet.</p>
          ) : (
            <div>
              {drivers.map(driver => {
                // Find assigned vehicle for this driver
                const assignedVehicle = vehicles.find(v => v.assigned_driver__username === driver.username);
                
                return (
                  <div key={driver.id} style={{ 
                    padding: 10, 
                    marginBottom: 8, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 4,
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{driver.username}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>ID: {driver.id}</div>
                    {assignedVehicle ? (
                      <div style={{ 
                        fontSize: 11, 
                        color: '#059669',
                        backgroundColor: '#dcfce7',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'inline-block'
                      }}>
                        🚗 {assignedVehicle.license_plate || assignedVehicle.vin}
                      </div>
                    ) : (
                      <div style={{ 
                        fontSize: 11, 
                        color: '#dc2626',
                        backgroundColor: '#fef2f2',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'inline-block'
                      }}>
                        ⚠️ No vehicle assigned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Data Button */}
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button 
          onClick={loadAllData}
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: loading ? '#ccc' : '#6c757d', 
            color: 'white', 
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh All Data'}
        </button>
      </div>
    </div>
  );
}

export default OrgManagerDashboard;