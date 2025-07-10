// frontend/src/components/OrgTree.js - ENHANCED WITH PROFESSIONAL STYLING
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OrgTree() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOrgs(res.data || []);
      } catch (err) {
        console.error("Error fetching orgs:", err.response?.data || err.message);
        setError('Failed to load organizations: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  const getOrgIcon = (orgName) => {
    // Different icons for different types of organizations
    if (orgName.toLowerCase().includes('tech')) return '💻';
    if (orgName.toLowerCase().includes('transport')) return '🚛';
    if (orgName.toLowerCase().includes('logistics')) return '📦';
    if (orgName.toLowerCase().includes('delivery')) return '🚚';
    if (orgName.toLowerCase().includes('corp')) return '🏢';
    if (orgName.toLowerCase().includes('enterprise')) return '🏬';
    return '🏢'; // default
  };

  const getRandomGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    return gradients[index % gradients.length];
  };

  const renderOrg = (org, depth = 0, index = 0) => (
    <div key={org.name} style={{ 
      marginBottom: 20,
      marginLeft: depth * 40,
      position: 'relative'
    }}>
      {/* Connection Line for Children */}
      {depth > 0 && (
        <div style={{
          position: 'absolute',
          left: -20,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, #e5e7eb, transparent)',
          opacity: 0.5
        }}></div>
      )}
      
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 25,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
      }}
      >
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          background: getRandomGradient(index),
          borderRadius: '50%',
          opacity: 0.1
        }}></div>

        {/* Depth Indicator */}
        {depth > 0 && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: getRandomGradient(index)
          }}></div>
        )}

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: 20,
            paddingBottom: 15,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: getRandomGradient(index),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              marginRight: 20,
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
            }}>
              {getOrgIcon(org.name)}
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: 20, 
                fontWeight: 700,
                color: '#1a1a2e',
                marginBottom: 5
              }}>
                {org.name}
              </h3>
              <div style={{ 
                fontSize: 14, 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span>Account: {org.account}</span>
                {depth > 0 && (
                  <span style={{
                    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    Level {depth}
                  </span>
                )}
              </div>
            </div>

            {/* Children Count Badge */}
            {org.children && org.children.length > 0 && (
              <div style={{
                background: getRandomGradient(index),
                color: 'white',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>👥</span>
                <span>{org.children.length} sub-org{org.children.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Organization Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 15,
            marginBottom: 15
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              padding: 15,
              borderRadius: 10,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 16, marginRight: 8 }}>🌐</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Website</span>
              </div>
              <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
                {org.website || 'Not specified'}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fef7cd, #fef3c7)',
              padding: 15,
              borderRadius: 10,
              border: '1px solid #fde68a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 16, marginRight: 8 }}>⛽</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Fuel Policy</span>
              </div>
              <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
                ${org.resolved_fuel_policy || 'Default'}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
              padding: 15,
              borderRadius: 10,
              border: '1px solid #f87171'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 16, marginRight: 8 }}>🚦</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>Speed Policy</span>
              </div>
              <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
                {org.resolved_speed_policy || 'Default'} mph
              </div>
            </div>
          </div>

          {/* Partnership Status */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                Active VMS Partner
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#047857' }}>
              Fleet Access Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Render Children */}
      {org.children && org.children.map((child, childIndex) => 
        renderOrg(child, depth + 1, index + childIndex + 1)
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
      }}>
        <div style={{
          width: 60,
          height: 60,
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }}></div>
        <h3 style={{ color: '#667eea', margin: 0 }}>Loading Partner Network...</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Building organization hierarchy</p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: 40,
        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
        minHeight: 400
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: '2px solid #fecaca'
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
          <h3 style={{ color: '#dc2626', marginBottom: 10 }}>Failed to Load Organizations</h3>
          <p style={{ color: '#666', marginBottom: 20 }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: 25,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
      padding: 30
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        padding: 30,
        color: 'white',
        marginBottom: 40,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginRight: 15 }}>🏢</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Partner Organization Network</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                Hierarchical view of all VMS partner companies and their organizational structure
              </p>
            </div>
          </div>
          
          {/* Network Stats */}
          <div style={{ 
            display: 'flex', 
            gap: 30, 
            marginTop: 20,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: 15,
                fontSize: 12,
                fontWeight: 600
              }}>
                📊 {orgs.length} Partner{orgs.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: 15,
                fontSize: 12,
                fontWeight: 600
              }}>
                🌐 Multi-level Structure
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: 15,
                fontSize: 12,
                fontWeight: 600
              }}>
                ✅ All Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Tree */}
      {orgs.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🏢</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 10 }}>No Partner Organizations</h3>
          <p style={{ color: '#666' }}>Create partner organizations to see the network structure here.</p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 30,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 30,
            paddingBottom: 20,
            borderBottom: '1px solid #f1f5f9'
          }}>
            <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: 20 }}>
              🌳 Organization Hierarchy
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: '#475569'
            }}>
              Live Network View
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            {orgs.map((org, index) => renderOrg(org, 0, index))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 25,
        marginTop: 30,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#1a1a2e' }}>🗺️ Network Legend</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 15,
          fontSize: 13,
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏢</span>
            <span>Partner Organization</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⛽</span>
            <span>Fuel Reimbursement Policy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🚦</span>
            <span>Speed Limit Policy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>👥</span>
            <span>Sub-organizations</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgTree;