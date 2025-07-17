// frontend/src/components/AttendanceSystem.js
import React, { useState, useEffect } from 'react';
import FaceVerification from './FaceVerification';

const AttendanceSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    setCurrentUser({ role: userRole, username });
    loadAttendanceLogs();
  }, []);

  const loadAttendanceLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/ai/face-attendance-logs/?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceLogs(data);
      }
    } catch (error) {
      console.error('Error loading attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceComplete = (result) => {
    if (result.match) {
      loadAttendanceLogs(); // Refresh logs
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', color: '#495057' }}>Face Recognition Attendance System</h2>
      
      {/* Face Verification for Check In/Out */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Check In/Out</h3>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div>
            <h4>Check In</h4>
            <FaceVerification 
              scanType="CHECK_IN" 
              onVerificationComplete={handleAttendanceComplete}
            />
          </div>
          <div>
            <h4>Check Out</h4>
            <FaceVerification 
              scanType="CHECK_OUT" 
              onVerificationComplete={handleAttendanceComplete}
            />
          </div>
        </div>
      </div>

      {/* Recent Attendance Logs */}
      <div>
        <h3>Recent Attendance (Last 7 Days)</h3>
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {attendanceLogs.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>User</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Type</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Confidence</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Time</th>
                    <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{log.user}</td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          backgroundColor: log.scan_type === 'CHECK_IN' ? '#d4edda' : '#f8d7da',
                          color: log.scan_type === 'CHECK_IN' ? '#155724' : '#721c24'
                        }}>
                          {log.scan_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{log.confidence}%</td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {log.verified_by || 'Self'}
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
export default AttendanceSystem;