// src/UploadImage.js
import React, { useState } from 'react';
import axios from 'axios';

function UploadImage() {
  const [image, setImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:8000/api/upload-image/', {
        image_base64: image,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setRecognizedText(res.data.recognized_text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>License Plate OCR</h2>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleUpload}>Upload & Recognize</button>
      {recognizedText && <p><strong>Detected:</strong> {recognizedText}</p>}
    </div>
  );
}

export default UploadImage;
