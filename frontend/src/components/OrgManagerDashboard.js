// frontend/src/components/OrgManagerDashboard.js - ENHANCED WITH WORKING SCHEDULES & CLICKABLE STATS
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
      // Load debug data to get everything
      const debugResponse = await axios.get('http://localhost:8000/api/debug-org/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const debugData = debugResponse.data;
      
      if (debugData.error) {
        setMessage(`❌ ${debugData.error}`);
        return;
      }

      // Set data from debug response
      const guardsData = debugData.org_users?.guards || [];
      const driversData = debugData.org_users?.drivers || [];
      const vehiclesData = debugData.vehicles?.org_vehicles || [];
      
      setGuards(guardsData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setAvailableVehicles(debugData.vehicles?.available_vehicles || []);
      
      // Load dashboard stats
      try {
        const dashResponse = await axios.get('http://localhost:8000/api/org-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashResponse.data);
      } catch (error) {
        console.warn('Dashboard stats not available:', error);
        setDashboardData({
          total_guards: guardsData.length,
          total_drivers: driversData.length,
          total_vehicles: vehiclesData.length,
          todays_attendance: 0
        });
      }

      // Load schedules
      await loadSchedules();
      
      setMessage('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage(`❌ Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSchedules = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:8000/api/schedules/?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const scheduleData = response.data || [];
      console.log('Loaded schedules:', scheduleData); // Debug log
      
      const guardSchedules = scheduleData.filter(s => s.user_role === 'GUARD');
      const driverSchedules = scheduleData.filter(s => s.user_role === 'DRIVER');
      
      // Add user names to schedules
      const enrichedGuardSchedules = guardSchedules.map(schedule => ({
        ...schedule,
        user_name: guards.find(g => g.id === schedule.user)?.username || `User ${schedule.user}`
      }));
      
      const enrichedDriverSchedules = driverSchedules.map(schedule => ({
        ...schedule,
        user_name: drivers.find(d => d.id === schedule.user)?.username || `User ${schedule.user}`
      }));
      
      setSchedules({
        guards: enrichedGuardSchedules,
        drivers: enrichedDriverSchedules
      });
    } catch (error) {
      console.warn('Error loading schedules:', error);
      setSchedules({ guards: [], drivers: [] });
    }
  }, [token, guards, drivers]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Update schedules when guards/drivers change
  useEffect(() => {
    if (guards.length > 0 || drivers.length > 0) {
      loadSchedules();
    }
  }, [guards, drivers, loadSchedules]);

  const createUser = async () => {
    if (!userForm.username || !userForm.password) {
      setMessage('❌ Please fill in username and password');
      return;
    }

    setCreateUserLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/create-guard-driver/', userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setUserForm({ username: '', password: '', role: 'GUARD' });
      
      await loadAllData();
      
    } catch (error) {
      console.error('Create user error:', error);
      setMessage(`❌ User creation failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.claimed > 0) {
        setMessage(`✅ Successfully claimed ${response.data.claimed} vehicle(s)!`);
        setSelectedVehicles([]);
        await loadAllData();
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
      const response = await axios.post('http://localhost:8000/api/assign-driver/', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setAssignForm({ driver_id: '', vehicle_id: '' });
      
      await loadAllData();
      
    } catch (error) {
      console.error('Assign driver error:', error);
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage(`✅ Schedules generated! ${response.data.guard_shifts || 0} guard shifts, ${response.data.driver_shifts || 0} driver shifts`);
      
      // Reload data to get the new schedules
      await loadAllData();
      
    } catch (error) {
      console.error('Generate schedules error:', error);
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

  // Navigation function for stat cards
  const navigateToSection = (section) => {
    // This would trigger navigation in the parent component
    // For now, we'll scroll to existing sections or show a message
    setMessage(`📊 Navigating to ${section} section...`);
  };

  const StatCard = ({ icon, title, value, color, subtitle, onClick }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 25,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{
        position: 'absolute',
        top: -10,
        right: -10,
        width: 60,
        height: 60,
        background: `${color}20`,
        borderRadius: '50%'
      }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginRight: 15
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#888' }}>{subtitle}</div>
      )}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 12,
        fontSize: 10,
        color: '#999',
        fontWeight: 600
      }}>
        Click to view →
      </div>
    </div>
  );

  const ScheduleCard = ({ title, schedules, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{
        background: color,
        color: 'white',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div>
          <h4 style={{ margin: 0, fontSize: 16 }}>{title}</h4>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 12 }}>
            {schedules.length} shift{schedules.length !== 1 ? 's' : ''} scheduled for today
          </p>
        </div>
      </div>
      
      <div style={{ padding: 20 }}>
        {schedules.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: 20,
            background: '#f8f9ff',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
            <p style={{ margin: 0, fontSize: 14 }}>No schedules for today</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#999' }}>
              Generate schedules to see assignments here
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {schedules.map((schedule, index) => (
              <div key={index} style={{
                padding: 15,
                background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
                      {schedule.user_name || `User ID: ${schedule.user}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {schedule.start_time} - {schedule.end_time}
                    </div>
                  </div>
                  <div style={{
                    background: color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    {schedule.shift_type || 'REGULAR'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
      }}>
        <div style={{
          width: 60,
          height: 60,
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #f093fb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }}></div>
        <h3 style={{ color: '#f093fb', margin: 0 }}>Loading Dashboard...</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Gathering team and fleet information</p>
        
        <style>{`
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
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
      padding: 30
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: 20,
        padding: 30,
        color: 'white',
        marginBottom: 30,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
            <div style={{ fontSize: 40, marginRight: 15 }}>👨‍💻</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Partner Operations Center</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                Manage your team, vehicles, and schedules efficiently
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: 15, 
          margin: '0 0 30px 0', 
          backgroundColor: message.includes('❌') ? '#fef2f2' : '#ecfdf5',
          color: message.includes('❌') ? '#dc2626' : '#065f46',
          borderRadius: 12,
          border: `1px solid ${message.includes('❌') ? '#fecaca' : '#a7f3d0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{ fontSize: 18 }}>
            {message.includes('❌') ? '⚠️' : '✅'}
          </div>
          <div>{message}</div>
        </div>
      )}

      {/* Dashboard Stats with Navigation */}
      {dashboardData && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 20, 
          marginBottom: 40 
        }}>
          <StatCard 
            icon="👮‍♂️" 
            title="Security Guards" 
            value={dashboardData.total_guards || guards.length}
            color="linear-gradient(135deg, #4facfe, #00f2fe)"
            subtitle="Active team members"
            onClick={() => navigateToSection('guards')}
          />
          <StatCard 
            icon="🚗" 
            title="Team Drivers" 
            value={dashboardData.total_drivers || drivers.length}
            color="linear-gradient(135deg, #43e97b, #38f9d7)"
            subtitle="Licensed drivers"
            onClick={() => navigateToSection('drivers')}
          />
          <StatCard 
            icon="🚙" 
            title="Fleet Vehicles" 
            value={dashboardData.total_vehicles || vehicles.length}
            color="linear-gradient(135deg, #fa709a, #fee140)"
            subtitle="Assigned vehicles"
            onClick={() => navigateToSection('vehicles')}
          />
          <StatCard 
            icon="📊" 
            title="Today's Attendance" 
            value={dashboardData.todays_attendance || 0}
            color="linear-gradient(135deg, #a8edea, #fed6e3)"
            subtitle="Check-ins recorded"
            onClick={() => navigateToSection('attendance')}
          />
        </div>
      )}

      {/* Today's Schedules Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 25
        }}>
          <h3 style={{ 
            margin: 0, 
            color: '#1a1a2e', 
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>📅</span>
            Today's Team Schedules
          </h3>
          <button 
            onClick={generateSchedules}
            disabled={scheduleLoading}
            style={{ 
              padding: '12px 24px', 
              background: scheduleLoading 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                : 'linear-gradient(135deg, #f093fb, #f5576c)', 
              color: 'white', 
              border: 'none',
              borderRadius: 25,
              fontSize: 14,
              fontWeight: 600,
              cursor: scheduleLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (!scheduleLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span>{scheduleLoading ? '⏳' : '🤖'}</span>
            {scheduleLoading ? 'Generating...' : 'Generate AI Schedules'}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: 25 
        }}>
          <ScheduleCard 
            title="Security Guard Shifts"
            schedules={schedules.guards}
            icon="👮‍♂️"
            color="linear-gradient(135deg, #4facfe, #00f2fe)"
          />
          <ScheduleCard 
            title="Driver Assignments"
            schedules={schedules.drivers}
            icon="🚗"
            color="linear-gradient(135deg, #43e97b, #38f9d7)"
          />
        </div>
      </div>

      {/* Quick Team Management */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        marginBottom: 30
      }}>
        <h3 style={{ margin: '0 0 25px 0', color: '#1a1a2e', fontSize: 20 }}>
          ➕ Quick Team Member Creation
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 15, 
          alignItems: 'end' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Username:
            </label>
            <input 
              placeholder="Enter username" 
              value={userForm.username} 
              onChange={e => setUserForm({...userForm, username: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f093fb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Password:
            </label>
            <input 
              type="password"
              placeholder="Enter password" 
              value={userForm.password} 
              onChange={e => setUserForm({...userForm, password: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f093fb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Role:
            </label>
            <select 
              value={userForm.role} 
              onChange={e => setUserForm({...userForm, role: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="GUARD">Security Guard</option>
              <option value="DRIVER">Driver</option>
            </select>
          </div>
          <button 
            onClick={createUser} 
            disabled={createUserLoading || !userForm.username || !userForm.password}
            style={{ 
              padding: 12, 
              background: createUserLoading || !userForm.username || !userForm.password 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                : 'linear-gradient(135deg, #f093fb, #f5576c)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8,
              cursor: createUserLoading || !userForm.username || !userForm.password ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!createUserLoading && userForm.username && userForm.password) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {createUserLoading ? '⏳ Creating...' : '✨ Create Member'}
          </button>
        </div>
      </div>

      {/* Vehicle Claims & Assignments */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: availableVehicles.length > 0 ? '1fr 1fr' : '1fr',
        gap: 30,
        marginBottom: 30 
      }}>
        {/* Available Vehicles to Claim */}
        {availableVehicles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 30,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 20 
            }}>
              <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: 18 }}>
                🚙 Claim Fleet Vehicles ({availableVehicles.length})
              </h3>
              <button 
                onClick={handleSelectAllVehicles}
                style={{ 
                  padding: '6px 12px', 
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {selectedVehicles.length === availableVehicles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
              {availableVehicles.slice(0, 5).map(vehicle => (
                <div key={vehicle.id} style={{ 
                  padding: 12, 
                  marginBottom: 8,
                  backgroundColor: selectedVehicles.includes(vehicle.id) ? '#f0f9ff' : '#f8f9fa',
                  border: `2px solid ${selectedVehicles.includes(vehicle.id) ? '#0ea5e9' : '#e5e7eb'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {vehicle.license_plate || 'No Plate'} - {vehicle.make} {vehicle.model}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        VIN: {vehicle.vin.slice(0, 8)}...
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            <button 
              onClick={claimVehicles} 
              disabled={selectedVehicles.length === 0 || claimLoading}
              style={{ 
                width: '100%',
                padding: 12, 
                background: selectedVehicles.length > 0 && !claimLoading 
                  ? 'linear-gradient(135deg, #10b981, #047857)' 
                  : 'linear-gradient(135deg, #9ca3af, #6b7280)', 
                color: 'white', 
                border: 'none',
                borderRadius: 8,
                cursor: selectedVehicles.length > 0 && !claimLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {claimLoading ? '⏳ Claiming...' : `🚙 Claim Selected (${selectedVehicles.length})`}
            </button>
          </div>
        )}

        {/* Driver Vehicle Assignment */}
        {drivers.length > 0 && vehicles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 30,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e', fontSize: 18 }}>
              🔗 Assign Vehicle to Driver
            </h3>
            <div style={{ display: 'grid', gap: 15, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Select Driver:
                </label>
                <select 
                  value={assignForm.driver_id} 
                  onChange={e => setAssignForm({...assignForm, driver_id: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    border: '2px solid #e5e7eb', 
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Choose Driver...</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Select Vehicle:
                </label>
                <select 
                  value={assignForm.vehicle_id} 
                  onChange={e => setAssignForm({...assignForm, vehicle_id: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    border: '2px solid #e5e7eb', 
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Choose Vehicle...</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate || vehicle.vin.slice(0, 8)} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={assignDriver}
              disabled={!assignForm.driver_id || !assignForm.vehicle_id || assignLoading}
              style={{ 
                width: '100%',
                padding: 12, 
                background: assignForm.driver_id && assignForm.vehicle_id && !assignLoading 
                  ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                  : 'linear-gradient(135deg, #9ca3af, #6b7280)', 
                color: 'white', 
                border: 'none',
                borderRadius: 8,
                cursor: assignForm.driver_id && assignForm.vehicle_id && !assignLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {assignLoading ? '⏳ Assigning...' : '🔗 Assign Driver to Vehicle'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrgManagerDashboard;// frontend/src/components/OrgManagerDashboard.js - ENHANCED WITH PROFESSIONAL STYLING & SCHEDULE DISPLAY
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
      // Load debug data to get everything
      const debugResponse = await axios.get('http://localhost:8000/api/debug-org/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const debugData = debugResponse.data;
      
      if (debugData.error) {
        setMessage(`❌ ${debugData.error}`);
        return;
      }

      // Set data from debug response
      setGuards(debugData.org_users?.guards || []);
      setDrivers(debugData.org_users?.drivers || []);
      setVehicles(debugData.vehicles?.org_vehicles || []);
      setAvailableVehicles(debugData.vehicles?.available_vehicles || []);
      
      // Load dashboard stats
      try {
        const dashResponse = await axios.get('http://localhost:8000/api/org-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(dashResponse.data);
      } catch (error) {
        console.warn('Dashboard stats not available:', error);
        setDashboardData({
          total_guards: debugData.org_users?.guards?.length || 0,
          total_drivers: debugData.org_users?.drivers?.length || 0,
          total_vehicles: debugData.vehicles?.org_vehicles?.length || 0,
          todays_attendance: 0
        });
      }

      // Load schedules
      await loadSchedules();
      
      setMessage('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage(`❌ Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSchedules = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:8000/api/schedules/?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const scheduleData = response.data || [];
      const guardSchedules = scheduleData.filter(s => s.user_role === 'GUARD');
      const driverSchedules = scheduleData.filter(s => s.user_role === 'DRIVER');
      
      setSchedules({
        guards: guardSchedules,
        drivers: driverSchedules
      });
    } catch (error) {
      console.warn('Error loading schedules:', error);
      setSchedules({ guards: [], drivers: [] });
    }
  }, [token]);

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
      const response = await axios.post('http://localhost:8000/api/create-guard-driver/', userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setUserForm({ username: '', password: '', role: 'GUARD' });
      
      await loadAllData();
      
    } catch (error) {
      console.error('Create user error:', error);
      setMessage(`❌ User creation failed: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.claimed > 0) {
        setMessage(`✅ Successfully claimed ${response.data.claimed} vehicle(s)!`);
        setSelectedVehicles([]);
        await loadAllData();
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
      const response = await axios.post('http://localhost:8000/api/assign-driver/', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage(`✅ ${response.data.message}`);
      setAssignForm({ driver_id: '', vehicle_id: '' });
      
      await loadAllData();
      
    } catch (error) {
      console.error('Assign driver error:', error);
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
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessage(`✅ Schedules generated! ${response.data.guard_shifts || 0} guard shifts, ${response.data.driver_shifts || 0} driver shifts`);
      
      await loadAllData();
      
    } catch (error) {
      console.error('Generate schedules error:', error);
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

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 25,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{
        position: 'absolute',
        top: -10,
        right: -10,
        width: 60,
        height: 60,
        background: `${color}20`,
        borderRadius: '50%'
      }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginRight: 15
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#888' }}>{subtitle}</div>
      )}
    </div>
  );

  const ScheduleCard = ({ title, schedules, icon, color }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{
        background: color,
        color: 'white',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div>
          <h4 style={{ margin: 0, fontSize: 16 }}>{title}</h4>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 12 }}>
            {schedules.length} shift{schedules.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
      </div>
      
      <div style={{ padding: 20 }}>
        {schedules.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: 20,
            background: '#f8f9ff',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
            <p style={{ margin: 0, fontSize: 14 }}>No schedules for today</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {schedules.map((schedule, index) => (
              <div key={index} style={{
                padding: 15,
                background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
                      {schedule.user_name || `User ID: ${schedule.user}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {schedule.start_time} - {schedule.end_time}
                    </div>
                  </div>
                  <div style={{
                    background: color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    {schedule.shift_type || 'REGULAR'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
      }}>
        <div style={{
          width: 60,
          height: 60,
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #f093fb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }}></div>
        <h3 style={{ color: '#f093fb', margin: 0 }}>Loading Dashboard...</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Gathering team and fleet information</p>
        
        <style>{`
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
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
      padding: 30
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: 20,
        padding: 30,
        color: 'white',
        marginBottom: 30,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
            <div style={{ fontSize: 40, marginRight: 15 }}>👨‍💻</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Partner Operations Center</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                Manage your team, vehicles, and schedules efficiently
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: 15, 
          margin: '0 0 30px 0', 
          backgroundColor: message.includes('❌') ? '#fef2f2' : '#ecfdf5',
          color: message.includes('❌') ? '#dc2626' : '#065f46',
          borderRadius: 12,
          border: `1px solid ${message.includes('❌') ? '#fecaca' : '#a7f3d0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{ fontSize: 18 }}>
            {message.includes('❌') ? '⚠️' : '✅'}
          </div>
          <div>{message}</div>
        </div>
      )}

      {/* Dashboard Stats */}
      {dashboardData && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 20, 
          marginBottom: 40 
        }}>
          <StatCard 
            icon="👮‍♂️" 
            title="Security Guards" 
            value={dashboardData.total_guards || guards.length}
            color="linear-gradient(135deg, #4facfe, #00f2fe)"
            subtitle="Active team members"
          />
          <StatCard 
            icon="🚗" 
            title="Team Drivers" 
            value={dashboardData.total_drivers || drivers.length}
            color="linear-gradient(135deg, #43e97b, #38f9d7)"
            subtitle="Licensed drivers"
          />
          <StatCard 
            icon="🚙" 
            title="Fleet Vehicles" 
            value={dashboardData.total_vehicles || vehicles.length}
            color="linear-gradient(135deg, #fa709a, #fee140)"
            subtitle="Assigned vehicles"
          />
          <StatCard 
            icon="📊" 
            title="Today's Attendance" 
            value={dashboardData.todays_attendance || 0}
            color="linear-gradient(135deg, #a8edea, #fed6e3)"
            subtitle="Check-ins recorded"
          />
        </div>
      )}

      {/* Today's Schedules Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 25
        }}>
          <h3 style={{ 
            margin: 0, 
            color: '#1a1a2e', 
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>📅</span>
            Today's Team Schedules
          </h3>
          <button 
            onClick={generateSchedules}
            disabled={scheduleLoading}
            style={{ 
              padding: '12px 24px', 
              background: scheduleLoading 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                : 'linear-gradient(135deg, #f093fb, #f5576c)', 
              color: 'white', 
              border: 'none',
              borderRadius: 25,
              fontSize: 14,
              fontWeight: 600,
              cursor: scheduleLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (!scheduleLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <span>{scheduleLoading ? '⏳' : '🤖'}</span>
            {scheduleLoading ? 'Generating...' : 'Generate AI Schedules'}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: 25 
        }}>
          <ScheduleCard 
            title="Security Guard Shifts"
            schedules={schedules.guards}
            icon="👮‍♂️"
            color="linear-gradient(135deg, #4facfe, #00f2fe)"
          />
          <ScheduleCard 
            title="Driver Assignments"
            schedules={schedules.drivers}
            icon="🚗"
            color="linear-gradient(135deg, #43e97b, #38f9d7)"
          />
        </div>
      </div>

      {/* Quick Team Management */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        marginBottom: 30
      }}>
        <h3 style={{ margin: '0 0 25px 0', color: '#1a1a2e', fontSize: 20 }}>
          ➕ Quick Team Member Creation
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 15, 
          alignItems: 'end' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Username:
            </label>
            <input 
              placeholder="Enter username" 
              value={userForm.username} 
              onChange={e => setUserForm({...userForm, username: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f093fb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Password:
            </label>
            <input 
              type="password"
              placeholder="Enter password" 
              value={userForm.password} 
              onChange={e => setUserForm({...userForm, password: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f093fb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
              Role:
            </label>
            <select 
              value={userForm.role} 
              onChange={e => setUserForm({...userForm, role: e.target.value})}
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #e5e7eb', 
                borderRadius: 8,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="GUARD">Security Guard</option>
              <option value="DRIVER">Driver</option>
            </select>
          </div>
          <button 
            onClick={createUser} 
            disabled={createUserLoading || !userForm.username || !userForm.password}
            style={{ 
              padding: 12, 
              background: createUserLoading || !userForm.username || !userForm.password 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                : 'linear-gradient(135deg, #f093fb, #f5576c)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8,
              cursor: createUserLoading || !userForm.username || !userForm.password ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!createUserLoading && userForm.username && userForm.password) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(240, 147, 251, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {createUserLoading ? '⏳ Creating...' : '✨ Create Member'}
          </button>
        </div>
      </div>

      {/* Vehicle Claims & Assignments */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: availableVehicles.length > 0 ? '1fr 1fr' : '1fr',
        gap: 30,
        marginBottom: 30 
      }}>
        {/* Available Vehicles to Claim */}
        {availableVehicles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 30,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 20 
            }}>
              <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: 18 }}>
                🚙 Claim Fleet Vehicles ({availableVehicles.length})
              </h3>
              <button 
                onClick={handleSelectAllVehicles}
                style={{ 
                  padding: '6px 12px', 
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {selectedVehicles.length === availableVehicles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
              {availableVehicles.slice(0, 5).map(vehicle => (
                <div key={vehicle.id} style={{ 
                  padding: 12, 
                  marginBottom: 8,
                  backgroundColor: selectedVehicles.includes(vehicle.id) ? '#f0f9ff' : '#f8f9fa',
                  border: `2px solid ${selectedVehicles.includes(vehicle.id) ? '#0ea5e9' : '#e5e7eb'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {vehicle.license_plate || 'No Plate'} - {vehicle.make} {vehicle.model}
                      </div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        VIN: {vehicle.vin.slice(0, 8)}...
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            <button 
              onClick={claimVehicles} 
              disabled={selectedVehicles.length === 0 || claimLoading}
              style={{ 
                width: '100%',
                padding: 12, 
                background: selectedVehicles.length > 0 && !claimLoading 
                  ? 'linear-gradient(135deg, #10b981, #047857)' 
                  : 'linear-gradient(135deg, #9ca3af, #6b7280)', 
                color: 'white', 
                border: 'none',
                borderRadius: 8,
                cursor: selectedVehicles.length > 0 && !claimLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {claimLoading ? '⏳ Claiming...' : `🚙 Claim Selected (${selectedVehicles.length})`}
            </button>
          </div>
        )}

        {/* Driver Vehicle Assignment */}
        {drivers.length > 0 && vehicles.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 30,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e', fontSize: 18 }}>
              🔗 Assign Vehicle to Driver
            </h3>
            <div style={{ display: 'grid', gap: 15, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Select Driver:
                </label>
                <select 
                  value={assignForm.driver_id} 
                  onChange={e => setAssignForm({...assignForm, driver_id: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    border: '2px solid #e5e7eb', 
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Choose Driver...</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>
                  Select Vehicle:
                </label>
                <select 
                  value={assignForm.vehicle_id} 
                  onChange={e => setAssignForm({...assignForm, vehicle_id: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    border: '2px solid #e5e7eb', 
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Choose Vehicle...</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate || vehicle.vin.slice(0, 8)} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={assignDriver}
              disabled={!assignForm.driver_id || !assignForm.vehicle_id || assignLoading}
              style={{ 
                width: '100%',
                padding: 12, 
                background: assignForm.driver_id && assignForm.vehicle_id && !assignLoading 
                  ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                  : 'linear-gradient(135deg, #9ca3af, #6b7280)', 
                color: 'white', 
                border: 'none',
                borderRadius: 8,
                cursor: assignForm.driver_id && assignForm.vehicle_id && !assignLoading ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {assignLoading ? '⏳ Assigning...' : '🔗 Assign Driver to Vehicle'}
            </button>
          </div>
        )}
      </div>

      {/* Team Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 30 
      }}>
        {/* Guards */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 30,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 20px 0', 
            color: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>👮‍♂️</span>
            Security Guards ({guards.length})
          </h4>
          {guards.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: 20,
              background: '#f8f9ff',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👮‍♂️</div>
              <p style={{ margin: 0, fontSize: 14 }}>No guards created yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {guards.slice(0, 3).map(guard => (
                <div key={guard.id} style={{ 
                  padding: 12, 
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
                  borderRadius: 8,
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontWeight: 600, color: '#0c4a6e' }}>{guard.username}</div>
                  <div style={{ fontSize: 11, color: '#0369a1' }}>ID: {guard.id}</div>
                </div>
              ))}
              {guards.length > 3 && (
                <div style={{ 
                  padding: 8, 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: 12,
                  fontStyle: 'italic'
                }}>
                  +{guards.length - 3} more guards
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drivers */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 30,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 20px 0', 
            color: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span>🚗</span>
            Team Drivers ({drivers.length})
          </h4>
          {drivers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: 20,
              background: '#f8f9ff',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚗</div>
              <p style={{ margin: 0, fontSize: 14 }}>No drivers created yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {drivers.slice(0, 3).map(driver => (
                <div key={driver.id} style={{ 
                  padding: 12, 
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
                  borderRadius: 8,
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontWeight: 600, color: '#14532d' }}>{driver.username}</div>
                  <div style={{ fontSize: 11, color: '#166534' }}>ID: {driver.id}</div>
                </div>
              ))}
              {drivers.length > 3 && (
                <div style={{ 
                  padding: 8, 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: 12,
                  fontStyle: 'italic'
                }}>
                  +{drivers.length - 3} more drivers
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrgManagerDashboard;