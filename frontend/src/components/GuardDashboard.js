// frontend/src/components/GuardDashboard.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function GuardDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('LOGIN');
  const [faceImage, setFaceImage] = useState('');
  const [verificationForm, setVerificationForm] = useState({
    driver_id: '',
    vehicle_id: '',
    license_plate_image: '',
    driver_face_image: ''
  });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/vehicles/guard-dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
      } catch (error) {
        console.error('Guard dashboard error:', error);
        setMessage('Error loading dashboard data');
      }
    };
    
    loadData();
  }, [token]);

  const recordAttendance = async () => {
    if (!selectedUser) {
      setMessage('Please select a user');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/vehicles/record-attendance/', {
        action: selectedAction,
        user_id: selectedUser,
        face_image: faceImage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`${selectedAction} recorded successfully for user`);
      setFaceImage('');
      // Reload dashboard data
      const res = await axios.get('http://localhost:8000/api/vehicles/guard-dashboard/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data);
    } catch (error) {
      setMessage('Error recording attendance: ' + (error.response?.data?.error || error.message));
    }
  };

  const verifyDriverVehicle = async () => {
    const { driver_id, vehicle_id } = verificationForm;
    
    if (!driver_id || !vehicle_id) {
      setMessage('Please select both driver and vehicle');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/vehicles/verify-driver-vehicle/', verificationForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Driver-Vehicle verification completed successfully!');
      setVerificationForm({
        driver_id: '',
        vehicle_id: '',
        license_plate_image: '',
        driver_face_image: ''
      });
      // Reload dashboard data
      const res = await axios.get('http://localhost:8000/api/vehicles/guard-dashboard/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data);
    } catch (error) {
      setMessage('Error in verification: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleFileUpload = (file, field) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (field === 'face_image') {
          setFaceImage(base64);
        } else {
          setVerificationForm(prev => ({
            ...prev,
            [field]: base64
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Guard Dashboard</h2>
      
      {message && (
        <div style={{ 
          padding: 10, 
          margin: '10px 0', 
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') ? '#c62828' : '#2e7d32',
          borderRadius: 4 
        }}>
          {message}
        </div>
      )}

      {/* My Shift Info */}
      {dashboardData && (
        <div style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
          <h3>My Shift Today</h3>
          {dashboardData.my_shift.start_time ? (
            <p>
              <strong>Shift Time:</strong> {dashboardData.my_shift.start_time} - {dashboardData.my_shift.end_time}
            </p>
          ) : (
            <p style={{ color: '#666' }}>No shift assigned for today</p>
          )}
        </div>
      )}

      {/* Record Attendance */}
      <div style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Record Attendance</h3>
        <div style={{ marginBottom: 15 }}>
          <label>Select User:</label>
          <select 
            value={selectedUser} 
            onChange={e => setSelectedUser(e.target.value)}
            style={{ padding: 8, marginLeft: 10, width: 200 }}
          >
            <option value="">Select User</option>
            {dashboardData?.assigned_drivers?.map(driver => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <label>Action:</label>
          <select 
            value={selectedAction} 
            onChange={e => setSelectedAction(e.target.value)}
            style={{ padding: 8, marginLeft: 10 }}
          >
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Face Image:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => handleFileUpload(e.target.files[0], 'face_image')}
            style={{ marginLeft: 10 }}
          />
        </div>

        <button 
          onClick={recordAttendance}
          disabled={!selectedUser}
          style={{ 
            padding: 10, 
            backgroundColor: selectedUser ? '#28a745' : '#ccc', 
            color: 'white', 
            border: 'none' 
          }}
        >
          Record {selectedAction}
        </button>
      </div>

      {/* Vehicle Verification */}
      <div style={{ marginBottom: 30, padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Verify Driver-Vehicle</h3>
        
        <div style={{ marginBottom: 15 }}>
          <label>Select Driver:</label>
          <select 
            value={verificationForm.driver_id} 
            onChange={e => setVerificationForm(prev => ({...prev, driver_id: e.target.value}))}
            style={{ padding: 8, marginLeft: 10, width: 200 }}
          >
            <option value="">Select Driver</option>
            {dashboardData?.assigned_drivers?.map(driver => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Select Vehicle:</label>
          <select 
            value={verificationForm.vehicle_id} 
            onChange={e => setVerificationForm(prev => ({...prev, vehicle_id: e.target.value}))}
            style={{ padding: 8, marginLeft: 10, width: 200 }}
          >
            <option value="">Select Vehicle</option>
            {dashboardData?.assigned_drivers?.map(driver => (
              driver.vehicle && (
                <option key={driver.vehicle_id} value={driver.vehicle_id}>
                  {driver.vehicle}
                </option>
              )
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>License Plate Image:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => handleFileUpload(e.target.files[0], 'license_plate_image')}
            style={{ marginLeft: 10 }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Driver Face Image:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => handleFileUpload(e.target.files[0], 'driver_face_image')}
            style={{ marginLeft: 10 }}
          />
        </div>

        <button 
          onClick={verifyDriverVehicle}
          disabled={!verificationForm.driver_id || !verificationForm.vehicle_id}
          style={{ 
            padding: 10, 
            backgroundColor: verificationForm.driver_id && verificationForm.vehicle_id ? '#007bff' : '#ccc', 
            color: 'white', 
            border: 'none' 
          }}
        >
          Verify Driver-Vehicle
        </button>
      </div>

      {/* Assigned Drivers */}
      <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 5 }}>
        <h3>Assigned Drivers Today</h3>
        {dashboardData?.assigned_drivers?.length > 0 ? (
          <div>
            {dashboardData.assigned_drivers.map(driver => (
              <div key={driver.id} style={{ margin: '10px 0', padding: 10, backgroundColor: '#f8f9fa' }}>
                <strong>{driver.name}</strong>
                <br />
                Vehicle: {driver.vehicle || 'No vehicle assigned'}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No drivers assigned for today</p>
        )}
      </div>
    </div>
  );
}

export default GuardDashboard;