// frontend/src/UploadImage.js
import React, { useState } from 'react';
import axios from 'axios';

function UploadImage() {
  const [image, setImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    setRecognizedText('');
    
    const token = localStorage.getItem('accessToken');
    
    try {
      const response = await axios.post('http://localhost:8000/api/vehicles/upload-image/', {
        image_base64: image,
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setRecognizedText(response.data.recognized_text || 'No text detected');
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error processing image: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>License Plate OCR</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Upload an image of a license plate to extract text using OCR technology.
      </p>

      {error && (
        <div style={{ 
          padding: 10, 
          marginBottom: 15, 
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: 4 
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold' }}>
          Select Image:
        </label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleImageChange}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
        />
      </div>

      {image && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold' }}>
            Preview:
          </label>
          <img 
            src={image} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: 300, 
              border: '1px solid #ddd',
              borderRadius: 4 
            }} 
          />
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!image || loading}
        style={{ 
          padding: 12, 
          backgroundColor: !image || loading ? '#ccc' : '#007bff', 
          color: 'white', 
          border: 'none',
          borderRadius: 4,
          fontSize: 16,
          cursor: !image || loading ? 'not-allowed' : 'pointer',
          marginBottom: 20
        }}
      >
        {loading ? 'Processing...' : 'Upload & Recognize Text'}
      </button>

      {recognizedText && (
        <div style={{ 
          padding: 15, 
          backgroundColor: '#e8f5e8',
          borderRadius: 4,
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Detected Text:</h3>
          <p style={{ 
            margin: 0, 
            fontFamily: 'monospace', 
            backgroundColor: 'white',
            padding: 10,
            borderRadius: 4,
            border: '1px solid #ddd'
          }}>
            {recognizedText}
          </p>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <p><strong>Supported formats:</strong> JPG, PNG, GIF, WEBP</p>
        <p><strong>Max file size:</strong> 5MB</p>
        <p><strong>Best results:</strong> Clear, well-lit images with readable text</p>
      </div>
    </div>
  );
}

export default UploadImage;