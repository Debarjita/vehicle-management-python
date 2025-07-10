// frontend/src/components/GuardDashboard.js - SIMPLIFIED VERSION
import React, { useState, useEffect } from "react";
import axios from "axios";

function GuardDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8000/api/guard-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
      } catch (error) {
        console.error('Guard dashboard error:', error);
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
        <h2>Guard Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Guard Dashboard</h2>
      
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

      {/* My Shift Today */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>My Shift Today</h3>
        {dashboardData?.my_shift ? (
          <div>
            {dashboardData.my_shift.start_time ? (
              <div style={{ 
                padding: 15, 
                backgroundColor: '#e8f5e8', 
                borderRadius: 4,
                border: '1px solid #c8e6c9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Shift Time:</strong> {dashboardData.my_shift.start_time} - {dashboardData.my_shift.end_time}
                  </div>
                  <div style={{ 
                    padding: '4px 12px', 
                    backgroundColor: '#2e7d32',
                    color: 'white',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {dashboardData.my_shift.status}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: 15, 
                backgroundColor: '#fff3cd', 
                color: '#856404', 
                borderRadius: 4,
                border: '1px solid #ffeaa7'
              }}>
                ⚠️ No shift assigned for today
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#666' }}>Loading shift information...</p>
        )}
      </div>

      {/* Assigned Drivers and Their Schedules */}
      <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#fff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1565c0' }}>
          Assigned Drivers Today ({dashboardData?.total_drivers_today || 0})
        </h3>
        
        {dashboardData?.assigned_drivers?.length > 0 ? (
          <div style={{ display: 'grid', gap: 15 }}>
            {dashboardData.assigned_drivers.map((driver, index) => (
              <div key={driver.id} style={{ 
                padding: 20,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                backgroundColor: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    👤 {driver.name}
                  </div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <strong>Vehicle:</strong> {driver.vehicle || 'No Vehicle Assigned'}
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    <strong>Schedule:</strong> {driver.shift_start} - {driver.shift_end}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    padding: '6px 12px', 
                    backgroundColor: driver.status === 'Active' ? '#28a745' : '#6c757d',
                    color: 'white',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginBottom: 8
                  }}>
                    {driver.status}
                  </div>
                  {driver.vehicle && (
                    <div style={{ 
                      padding: '4px 8px', 
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: 3,
                      fontSize: 11
                    }}>
                      🚗 {driver.vehicle}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>No Drivers Assigned Today</h4>
            <p style={{ margin: 0 }}>
              No driver shifts have been scheduled for today. 
              Contact your organization manager to generate schedules.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: 30, 
        padding: 15, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 4,
        border: '1px solid #bbdefb'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Guard Responsibilities:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#424242' }}>
          <li>Monitor all assigned drivers during your shift</li>
          <li>Verify driver identity and vehicle assignments</li>
          <li>Record entry/exit logs for vehicles</li>
          <li>Report any irregularities to management</li>
        </ul>
      </div>
    </div>
  );
}

export default GuardDashboard;