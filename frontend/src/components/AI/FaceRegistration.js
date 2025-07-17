import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const FaceRegistration = ({ userId, onRegistrationComplete }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [orgUsers, setOrgUsers] = useState([]);
  const webcamRef = useRef(null);

  // Load organization users when component mounts
  React.useEffect(() => {
    loadOrgUsers();
  }, []);

  const loadOrgUsers = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('http://localhost:8000/api/my-org-users/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Handle different response formats
      if (Array.isArray(data)) {
        setOrgUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setOrgUsers(data.users);
      } else {
        console.error('Unexpected API response format:', data);
        setOrgUsers([]); // Set empty array as fallback
      }
    }
  } catch (error) {
    console.error('Error loading users:', error);
    setOrgUsers([]); // Set empty array as fallback
  }
};

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

  const handleRegisterFace = async () => {
    if (!capturedImage) {
      setMessage('Please capture a photo first');
      return;
    }

    if (!selectedUserId) {
      setMessage('Please select a user');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/ai/register-face/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          image: capturedImage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Face registered successfully for ${data.user}!`);
        setCapturedImage(null);
        if (onRegistrationComplete) {
          onRegistrationComplete(data);
        }
      } else {
        setMessage(`❌ ${data.error || 'Registration failed'}`);
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(true);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '25px', 
      border: '2px solid #e1e5e9',
      borderRadius: '15px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ textAlign: 'center', color: '#495057', marginBottom: '25px' }}>
        👤 Face Registration System
      </h3>
      
      {/* User Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
          Select User to Register:
        </label>
        <select 
          value={selectedUserId} 
          onChange={(e) => setSelectedUserId(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '2px solid #ced4da',
            fontSize: '16px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Choose a user...</option>
          {orgUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.role})
            </option>
          ))}
        </select>
      </div>
      
      {!isCapturing && !capturedImage && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', color: '#6c757d' }}>
            Click "Start Camera" to capture a face photo for registration
          </p>
          <button
            onClick={() => setIsCapturing(true)}
            disabled={!selectedUserId}
            style={{
              padding: '15px 30px',
              backgroundColor: selectedUserId ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedUserId ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📷 Start Camera
          </button>
        </div>
      )}

      {isCapturing && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '3px solid #007bff', 
            borderRadius: '15px', 
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              style={{ display: 'block' }}
            />
          </div>
          <div>
            <button
              onClick={capturePhoto}
              style={{
                padding: '15px 30px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '15px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📸 Capture Photo
            </button>
            <button
              onClick={() => setIsCapturing(false)}
              style={{
                padding: '15px 30px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '3px solid #28a745', 
            borderRadius: '15px', 
            overflow: 'hidden',
            marginBottom: '20px',
            display: 'inline-block'
          }}>
            <img 
              src={capturedImage} 
              alt="Captured face" 
              style={{ 
                width: '100%', 
                maxWidth: '300px',
                display: 'block'
              }} 
            />
          </div>
          <div>
            <button
              onClick={handleRegisterFace}
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '15px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Registering...' : '✅ Register Face'}
            </button>
            <button
              onClick={retakePhoto}
              style={{
                padding: '15px 30px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🔄 Retake Photo
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          textAlign: 'center',
          fontWeight: 'bold',
          border: `2px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;