import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const LicensePlateScanner = ({ entryType = 'ENTRY', vehicleId = null, onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const webcamRef = useRef(null);

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsScanning(false);
  }, [webcamRef]);

  const scanLicensePlate = async () => {
    if (!capturedImage) {
      setMessage('Please capture an image first');
      return;
    }

    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/ai/scan-license-plate/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          entry_type: entryType,
          vehicle_id: vehicleId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.detected) {
          if (data.matched_vehicle) {
            setMessage(`✅ License plate ${data.plate_number} detected and matched to ${data.matched_vehicle.make} ${data.matched_vehicle.model}`);
          } else {
            setMessage(`⚠️ License plate ${data.plate_number} detected but no matching vehicle found`);
          }
        } else {
          setMessage('❌ Could not detect license plate');
        }
        
        if (onScanComplete) {
          onScanComplete(data);
        }
      } else {
        setMessage(data.error || 'Scan failed');
      }
    } catch (error) {
      setMessage('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    setMessage('');
    setIsScanning(true);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '2px solid #e1e5e9',
      borderRadius: '10px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ textAlign: 'center', color: '#495057' }}>
        License Plate Scanner - {entryType}
      </h3>
      
      {!isScanning && !capturedImage && (
        <div style={{ textAlign: 'center' }}>
          <p>Position the vehicle's license plate clearly in the camera view</p>
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
            📷 Start Camera
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
              onClick={captureImage}
              style={{
                padding: '15px 30px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px',
                fontSize: '16px'
              }}
            >
              📸 Capture Image
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

      {capturedImage && (
        <div style={{ textAlign: 'center' }}>
          <img 
            src={capturedImage} 
            alt="Captured license plate" 
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              borderRadius: '10px',
              marginBottom: '15px'
            }} 
          />
          <div>
            <button
              onClick={scanLicensePlate}
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px',
                fontSize: '16px'
              }}
            >
              {loading ? '⏳ Scanning...' : '🔍 Scan Plate'}
            </button>
            <button
              onClick={retakePhoto}
              style={{
                padding: '15px 30px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔄 Retake Photo
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          borderRadius: '5px',
          backgroundColor: result?.detected && result?.matched_vehicle ? '#d4edda' : 
                           result?.detected ? '#fff3cd' : '#f8d7da',
          color: result?.detected && result?.matched_vehicle ? '#155724' : 
                 result?.detected ? '#856404' : '#721c24',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      {result && result.detected && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          borderRadius: '5px',
          backgroundColor: '#e8f4fd',
          border: '1px solid #007bff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Scan Results</h4>
          <p><strong>Detected Plate:</strong> {result.plate_number}</p>
          <p><strong>Confidence:</strong> {result.confidence}%</p>
          <p><strong>Entry Type:</strong> {entryType}</p>
          {result.matched_vehicle && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
              <p><strong>Matched Vehicle:</strong></p>
              <p>• Make: {result.matched_vehicle.make}</p>
              <p>• Model: {result.matched_vehicle.model}</p>
              <p>• Year: {result.matched_vehicle.year}</p>
              <p>• Status: {result.matched_vehicle.status}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default LicensePlateScanner;