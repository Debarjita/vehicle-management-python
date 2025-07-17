// frontend/src/components/AIFeatures.js
import React, { useState } from 'react';
import { FaceRegistration, FaceVerification, AttendanceSystem, VehicleScanner } from './AI/index';

const AIFeatures = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const userRole = localStorage.getItem('userRole');

  const tabs = [
    { id: 'attendance', label: '👤 Face Attendance', roles: ['ADMIN', 'GUARD', 'DRIVER', 'ORG_MANAGER'] },
    { id: 'registration', label: '📝 Face Registration', roles: ['ADMIN', 'ORG_MANAGER'] },
    { id: 'vehicle-scanner', label: '🚗 Vehicle Scanner', roles: ['ADMIN', 'GUARD', 'ORG_MANAGER'] },
    { id: 'verification', label: '🔍 Quick Verify', roles: ['ADMIN', 'GUARD', 'ORG_MANAGER'] }
  ];

  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceSystem />;
      case 'registration':
        return (
          <div>
            <h3>Face Registration System</h3>
            <p>Register faces for users in your organization</p>
            <FaceRegistration 
              onRegistrationComplete={(result) => {
                alert(`Face registered for ${result.user}!`);
              }}
            />
          </div>
        );
      case 'vehicle-scanner':
        return <VehicleScanner />;
      case 'verification':
        return (
          <div>
            <h3>Quick Face Verification</h3>
            <p>Verify identity for general purposes</p>
            <FaceVerification 
              scanType="VERIFICATION"
              onVerificationComplete={(result) => {
                if (result.match) {
                  alert(`Verified: ${result.user.username} (${result.confidence}% confidence)`);
                } else {
                  alert('Face not recognized');
                }
              }}
            />
          </div>
        );
      default:
        return <div>Select a feature from the tabs above</div>;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>🤖 AI Features</h1>
        <p style={{ margin: 0, fontSize: '1.2em', opacity: 0.9 }}>
          Face Recognition & License Plate Detection System
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e1e5e9', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#495057',
              borderRadius: '10px 10px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === tab.id ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        minHeight: '500px'
      }}>
        {renderTabContent()}
      </div>

      {/* Usage Tips */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e8f4fd',
        borderRadius: '10px',
        border: '1px solid #b3d4fc'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#0c5aa6' }}>💡 Usage Tips</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5aa6' }}>
          <li><strong>Face Recognition:</strong> Ensure good lighting and look directly at camera</li>
          <li><strong>License Plates:</strong> Position plate clearly in camera view, avoid glare</li>
          <li><strong>Permissions:</strong> Allow camera access when prompted by browser</li>
          <li><strong>Performance:</strong> Processing may take 2-5 seconds depending on image quality</li>
        </ul>
      </div>
    </div>
  );
};

export default AIFeatures;