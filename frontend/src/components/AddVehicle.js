// frontend/src/components/AddVehicle.js
import React, { useState } from 'react';
import axios from 'axios';

function AddVehicle() {
  const [formData, setFormData] = useState({
    vin: '',
    org: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    license_plate: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [vinLoading, setVinLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVinDecode = async () => {
    if (!formData.vin || formData.vin.length !== 17) {
      setMessage('❌ Please enter a valid 17-character VIN');
      return;
    }

    setVinLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await axios.get(
        `http://localhost:8000/api/decode-vin/${formData.vin}/`,
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const decoded = response.data;
      
      // Auto-fill form with decoded data
      setFormData(prev => ({
        ...prev,
        make: decoded.make || prev.make,
        model: decoded.model || prev.model,
        year: decoded.year || prev.year,
      }));

      setMessage(`✅ VIN decoded successfully! Make: ${decoded.make}, Model: ${decoded.model}, Year: ${decoded.year}`);
      
    } catch (err) {
      console.error('VIN decode error:', err);
      setMessage('❌ VIN decode failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setVinLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ File size must be less than 5MB');
      return;
    }

    setOcrLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setImagePreview(base64Image);

        try {
          const response = await axios.post('http://localhost:8000/api/upload-image/', {
            image_base64: base64Image,
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const recognizedText = response.data.recognized_text || '';
          if (recognizedText.trim()) {
            setFormData(prev => ({
              ...prev,
              license_plate: recognizedText.trim().toUpperCase()
            }));
            setMessage(`✅ License plate detected: ${recognizedText.trim()}`);
          } else {
            setMessage('⚠️ No text detected in image. Please enter license plate manually.');
          }
        } catch (err) {
          console.error('OCR error:', err);
          setMessage('❌ OCR failed: ' + (err.response?.data?.error || err.message));
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMessage('❌ Error processing image: ' + err.message);
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const token = localStorage.getItem('accessToken');
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/add-vehicle/',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setMessage('✅ Vehicle added successfully!');
      console.log('Vehicle added:', response.data);
      
      // Reset form
      setFormData({
        vin: '',
        org: '',
        make: '',
        model: '',
        year: '',
        mileage: '',
        license_plate: ''
      });
      setImagePreview(null);
      
    } catch (err) {
      console.error('Add vehicle error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add vehicle';
      setMessage('❌ Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800 }}>
      <h2>Add Vehicle</h2>
      
      {message && (
        <div style={{ 
          padding: 10, 
          margin: '10px 0', 
          backgroundColor: message.includes('Error') || message.includes('❌') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') || message.includes('❌') ? '#c62828' : '#2e7d32',
          borderRadius: 4 
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        {/* VIN Section */}
        <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 4 }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Vehicle Identification</h3>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>VIN (17 characters) *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                name="vin"
                placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)" 
                value={formData.vin} 
                onChange={handleChange}
                maxLength={17}
                style={{ flex: 1, padding: 8, fontFamily: 'monospace' }}
                required
              />
              <button 
                type="button"
                onClick={handleVinDecode}
                disabled={vinLoading || !formData.vin || formData.vin.length !== 17}
                style={{ 
                  padding: 8, 
                  backgroundColor: vinLoading ? '#ccc' : '#28a745', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: 4,
                  cursor: vinLoading ? 'not-allowed' : 'pointer',
                  minWidth: 120
                }}
              >
                {vinLoading ? 'Decoding...' : 'Decode VIN'}
              </button>
            </div>
          </div>
        </div>

        {/* License Plate Section */}
        <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 4 }}>
          <h3 style={{ margin: '0 0 15px 0' }}>License Plate</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>License Plate Number</label>
              <input 
                name="license_plate"
                placeholder="Enter license plate or scan image" 
                value={formData.license_plate} 
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
              
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Or Upload License Plate Image:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  style={{ width: '100%', padding: 8 }}
                  disabled={ocrLoading}
                />
                {ocrLoading && <p style={{ fontSize: 12, color: '#666' }}>Processing image...</p>}
              </div>
            </div>
            
            {imagePreview && (
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Image Preview:</label>
                <img 
                  src={imagePreview} 
                  alt="License plate preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 150, 
                    border: '1px solid #ddd',
                    borderRadius: 4 
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Details */}
        <div style={{ padding: 15, border: '1px solid #ddd', borderRadius: 4 }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Vehicle Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                Organization {localStorage.getItem('userRole') === 'ADMIN' ? '(Optional - leave blank for vehicle pool)' : '(Auto-assigned to your org)'}
              </label>
              <input 
                name="org"
                placeholder={localStorage.getItem('userRole') === 'ADMIN' ? "Organization name or leave blank" : "Auto-assigned to your organization"} 
                value={formData.org} 
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
                disabled={localStorage.getItem('userRole') !== 'ADMIN'}
              />
              {localStorage.getItem('userRole') === 'ADMIN' && (
                <small style={{ color: '#666', fontSize: 12 }}>
                  Leave blank to add vehicle to unassigned pool for later organization assignment
                </small>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Make</label>
              <input 
                name="make"
                placeholder="Make (e.g., Toyota)" 
                value={formData.make} 
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Model</label>
              <input 
                name="model"
                placeholder="Model (e.g., Camry)" 
                value={formData.model} 
                onChange={handleChange}
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Year</label>
              <input 
                name="year"
                type="number"
                placeholder="Year (e.g., 2020)" 
                value={formData.year} 
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Mileage</label>
              <input 
                name="mileage"
                type="number"
                placeholder="Mileage" 
                value={formData.mileage} 
                onChange={handleChange}
                min="0"
                style={{ width: '100%', padding: 8 }}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !formData.vin}
          style={{ 
            padding: 15, 
            backgroundColor: loading || !formData.vin ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: loading || !formData.vin ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
        </button>
      </form>
    </div>
  );
}

export default AddVehicle;