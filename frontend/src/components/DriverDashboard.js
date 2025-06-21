// frontend/src/components/DriverDashboard.js
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
        const res = await axios.get('http://localhost:8000/api/vehicles/driver-dashboard/', {
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

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Driver Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

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

      {/* Today's Schedule */}
      <div style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Today's Schedule</h3>
        {dashboardData?.todays_schedule ? (
          <div>
            {dashboardData.todays_schedule.vehicle ? (
              <>
                <p><strong>Assigned Vehicle:</strong> {dashboardData.todays_schedule.vehicle}</p>
                <p><strong>Shift Time:</strong> {dashboardData.todays_schedule.start_time} - {dashboardData.todays_schedule.end_time}</p>
                <div style={{ 
                  padding: 10, 
                  backgroundColor: '#e8f5e8', 
                  color: '#2e7d32', 
                  borderRadius: 4,
                  marginTop: 10 
                }}>
                  ✅ You have been assigned a vehicle for today
                </div>
              </>
            ) : (
              <div style={{ 
                padding: 10, 
                backgroundColor: '#fff3cd', 
                color: '#856404', 
                borderRadius: 4 
              }}>
                ⚠️ No vehicle assigned for today. Please contact your manager.
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            padding: 10, 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: 4 
          }}>
            ❌ No schedule found for today
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}>
            Start Shift
          </button>
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}>
            End Shift
          </button>
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}>
            Report Issue
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
          Note: These buttons are for demonstration. Full functionality requires additional implementation.
        </p>
      </div>

      {/* Attendance History */}
      <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Recent Attendance History</h3>
        {dashboardData?.attendance_history?.length > 0 ? (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {dashboardData.attendance_history.map((record, index) => (
              <div key={index} style={{ 
                margin: '10px 0', 
                padding: 10, 
                backgroundColor: record.action === 'LOGIN' ? '#e8f5e8' : '#fff3cd',
                borderRadius: 4 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{record.action}</strong> - {formatDateTime(record.timestamp)}
                  </span>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    Verified by: {record.verified_by}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No attendance records found</p>
        )}
      </div>

      {/* Vehicle Information */}
      {dashboardData?.todays_schedule?.vehicle && (
        <div style={{ marginTop: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
          <h3>Vehicle Information</h3>
          <div style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 4 }}>
            <p><strong>License Plate:</strong> {dashboardData.todays_schedule.vehicle}</p>
            <p><strong>Status:</strong> Assigned to you</p>
            <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
              Please ensure you complete the vehicle verification process with the guard before starting your shift.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;