// frontend/src/components/TeamDrivers.js - NEW FILE
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TeamDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [debugRes, scheduleRes] = await Promise.all([
          axios.get('http://localhost:8000/api/debug-org/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8000/api/schedules/?date=${new Date().toISOString().split('T')[0]}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] }))
        ]);

        setDrivers(debugRes.data.org_users?.drivers || []);
        setVehicles(debugRes.data.vehicles?.org_vehicles || []);
        setSchedules(scheduleRes.data.filter(s => s.user_role === 'DRIVER') || []);
      } catch (error) {
        setMessage('Error loading drivers data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const getDriverVehicle = (driverId) => {
    return vehicles.find(v => v.assigned_driver__username === drivers.find(d => d.id === driverId)?.username);
  };

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
          borderTop: '4px solid #43e97b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }}></div>
        <h3 style={{ color: '#43e97b', margin: 0 }}>Loading Team Drivers...</h3>
        
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
            <div style={{ fontSize: 40, marginRight: 15 }}>🚗</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Team Drivers</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                {drivers.length} licensed drivers managing fleet operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: 15, 
          margin: '0 0 30px 0', 
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: 12,
          border: '1px solid #fecaca'
        }}>
          ⚠️ {message}
        </div>
      )}

      {drivers.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🚗</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 10 }}>No Team Drivers</h3>
          <p style={{ color: '#666' }}>Create drivers from the dashboard to see them here.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 25 
        }}>
          {drivers.map(driver => {
            const driverSchedule = schedules.find(s => s.user === driver.id);
            const assignedVehicle = getDriverVehicle(driver.id);
            
            return (
              <div key={driver.id} style={{
                background: 'white',
                borderRadius: 16,
                padding: 25,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginRight: 15
                  }}>
                    🚗
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>
                      {driver.username}
                    </h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                      Driver ID: {driver.id}
                    </p>
                  </div>
                </div>

                {/* Schedule */}
                {driverSchedule ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    padding: 15,
                    borderRadius: 10,
                    border: '1px solid #a7f3d0',
                    marginBottom: 15
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>📅</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                        Today's Schedule
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#047857' }}>
                      <strong>{driverSchedule.start_time} - {driverSchedule.end_time}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                      Shift Type: {driverSchedule.shift_type || 'Regular'}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    padding: 15,
                    borderRadius: 10,
                    border: '1px solid #f59e0b',
                    marginBottom: 15
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>⏰</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
                        No Schedule Today
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#d97706' }}>
                      Generate schedules to assign shifts
                    </div>
                  </div>
                )}

                {/* Assigned Vehicle */}
                {assignedVehicle ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                    padding: 15,
                    borderRadius: 10,
                    border: '1px solid #c4b5fd',
                    marginBottom: 15
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>🚙</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5b21b6' }}>
                        Assigned Vehicle
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#6d28d9' }}>
                      <strong>{assignedVehicle.license_plate || 'No Plate'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>
                      {assignedVehicle.make} {assignedVehicle.model}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                    padding: 15,
                    borderRadius: 10,
                    border: '1px solid #f87171',
                    marginBottom: 15
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>🚫</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#991b1b' }}>
                        No Vehicle Assigned
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#dc2626' }}>
                      Assign vehicle from dashboard
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10
                }}>
                  <div style={{
                    background: '#f8fafc',
                    padding: 10,
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Status</div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>Active</div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    padding: 10,
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>License</div>
                    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>Valid</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamDrivers;