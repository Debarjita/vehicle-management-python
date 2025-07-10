// frontend/src/components/DriverDashboard.js - SIMPLIFIED VERSION
import React, { useState, useEffect } from "react";
import axios from "axios";

function DriverDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8000/api/driver-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
      } catch (error) {
        console.error('Driver dashboard error:', error);
        setMessage('Error loading dashboard data: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Driver Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const hasVehicle = dashboardData?.assigned_vehicle;
  const hasSchedule = dashboardData?.todays_schedule?.has_shift;

  return (
    <div style={{ padding: 20 }}>
      <h2>Driver Dashboard</h2>
      
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

      {/* Assigned Vehicle */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1565c0' }}>🚗 My Assigned Vehicle</h3>
        
        {hasVehicle ? (
          <div style={{ 
            padding: 20, 
            backgroundColor: '#e8f5e8', 
            borderRadius: 8,
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>License Plate</div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {dashboardData.assigned_vehicle.license_plate || 'No Plate'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Vehicle</div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {dashboardData.assigned_vehicle.make} {dashboardData.assigned_vehicle.model}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Status</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px', 
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 'bold'
                }}>
                  {dashboardData.assigned_vehicle.status || 'ASSIGNED'}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 15, padding: 15, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 4 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>VIN</div>
              <div style={{ fontFamily: 'monospace', fontSize: 16 }}>
                {dashboardData.assigned_vehicle.vin}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: 20, 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            borderRadius: 8,
            border: '1px solid #ffeaa7',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>⚠️ No Vehicle Assigned</h4>
            <p style={{ margin: 0 }}>
              You don't have a vehicle assigned yet. Please contact your manager to get a vehicle assignment.
            </p>
          </div>
        )}
      </div>

      {/* Today's Schedule */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#e65100' }}>📅 Today's Schedule</h3>
        
        {hasSchedule ? (
          <div style={{ 
            padding: 20, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 8,
            border: '1px solid #bbdefb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Shift Start</div>
                <div style={{ fontWeight: 'bold', fontSize: 20, color: '#1565c0' }}>
                  {dashboardData.todays_schedule.start_time}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Shift End</div>
                <div style={{ fontWeight: 'bold', fontSize: 20, color: '#1565c0' }}>
                  {dashboardData.todays_schedule.end_time}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Vehicle for Today</div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {dashboardData.todays_schedule.vehicle || 'Same as assigned'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Status</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '6px 12px', 
                  backgroundColor: '#1565c0',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 'bold'
                }}>
                  {dashboardData.todays_schedule.status}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: 20, 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            borderRadius: 8,
            border: '1px solid #ffcdd2',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>❌ No Schedule for Today</h4>
            <p style={{ margin: 0 }}>
              No shift has been scheduled for you today. Contact your manager if you expected to have a shift.
            </p>
          </div>
        )}
      </div>

      {/* Driver Instructions */}
      <div style={{ 
        padding: 20, 
        backgroundColor: '#f3e5f5', 
        borderRadius: 8,
        border: '1px solid #e1bee7'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>📋 Driver Responsibilities:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
          <div>
            <h5 style={{ margin: '0 0 8px 0', color: '#4a148c' }}>Before Your Shift:</h5>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#424242', fontSize: 14 }}>
              <li>Report to guard for verification</li>
              <li>Complete vehicle inspection</li>
              <li>Check fuel level</li>
            </ul>
          </div>
          <div>
            <h5 style={{ margin: '0 0 8px 0', color: '#4a148c' }}>During Your Shift:</h5>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#424242', fontSize: 14 }}>
              <li>Follow assigned routes</li>
              <li>Maintain communication</li>
              <li>Report any issues immediately</li>
            </ul>
          </div>
          <div>
            <h5 style={{ margin: '0 0 8px 0', color: '#4a148c' }}>After Your Shift:</h5>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#424242', fontSize: 14 }}>
              <li>Return vehicle to designated area</li>
              <li>Complete end-of-shift report</li>
              <li>Report to guard for check-out</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Status Summary */}
      {(hasVehicle || hasSchedule) && (
        <div style={{ 
          marginTop: 20, 
          padding: 15, 
          backgroundColor: hasVehicle && hasSchedule ? '#e8f5e8' : '#fff3cd',
          borderRadius: 4,
          textAlign: 'center'
        }}>
          <strong>Status Summary: </strong>
          {hasVehicle && hasSchedule ? (
            <span style={{ color: '#2e7d32' }}>✅ Ready for duty - Vehicle assigned and shift scheduled</span>
          ) : hasVehicle ? (
            <span style={{ color: '#f57c00' }}>⚠️ Vehicle assigned but no shift scheduled</span>
          ) : hasSchedule ? (
            <span style={{ color: '#f57c00' }}>⚠️ Shift scheduled but no vehicle assigned</span>
          ) : (
            <span style={{ color: '#d32f2f' }}>❌ Not ready - Missing vehicle assignment and schedule</span>
          )}
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;