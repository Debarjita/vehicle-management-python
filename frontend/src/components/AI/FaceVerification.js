import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const FaceVerification = ({ scanType = 'VERIFICATION', targetUserId = null, onVerificationComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const webcamRef = useRef(null);

  const scanFace = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/ai/verify-face/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc,
          scan_type: scanType,
          user_id: targetUserId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.match) {
          setMessage(`✅ Face verified! User: ${data.user.username} (${data.confidence}% confidence)`);
        } else {
          setMessage('❌ Face not recognized');
        }
        
        if (onVerificationComplete) {
          onVerificationComplete(data);
        }
      } else {
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setMessage('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [webcamRef, scanType, targetUserId, onVerificationComplete]);

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '2px solid #e1e5e9',
      borderRadius: '10px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ textAlign: 'center', color: '#495057' }}>
        Face Verification - {scanType.replace('_', ' ')}
      </h3>
      
      {!isScanning && (
        <div style={{ textAlign: 'center' }}>
          <p>Position your face in front of the camera and click scan</p>
          <button
            onClick={() => setIsScanning(true)}
            style={{
              padding: '15px 30px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔍 Start Face Scanner
          </button>
        </div>
      )}

      {isScanning && (
        <div style={{ textAlign: 'center' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            style={{ borderRadius: '10px', marginBottom: '15px' }}
          />
          <div>
            <button
              onClick={scanFace}
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px',
                fontSize: '16px'
              }}
            >
              {loading ? '⏳ Scanning...' : '📸 Scan Face'}
            </button>
            <button
              onClick={() => setIsScanning(false)}
              style={{
                padding: '15px 30px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          borderRadius: '5px',
          backgroundColor: result?.match ? '#d4edda' : '#f8d7da',
          color: result?.match ? '#155724' : '#721c24',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default FaceVerification;     