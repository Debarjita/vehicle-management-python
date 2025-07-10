// frontend/src/components/AdminVehicleOverview.js - ENHANCED WITH CAPTIVATING UI
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const AdminVehicleOverview = () => {
  const [allVehicles, setAllVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [claimedVehicles, setClaimedVehicles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('accessToken');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [vehiclesRes, availableRes, orgsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/vehicles/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/available/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const vehicles = vehiclesRes.data || [];
      const available = availableRes.data || [];
      const orgs = orgsRes.data || [];
      
      setAllVehicles(vehicles);
      setAvailableVehicles(available);
      setClaimedVehicles(vehicles.filter(v => v.org));
      setOrganizations(orgs);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Failed to load vehicle data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Unknown Organization';
  };

  const groupVehiclesByOrg = () => {
    const grouped = {};
    claimedVehicles.forEach(vehicle => {
      const orgName = vehicle.org ? getOrgName(vehicle.org) : 'No Organization';
      if (!grouped[orgName]) {
        grouped[orgName] = [];
      }
      grouped[orgName].push(vehicle);
    });
    return grouped;
  };

  const FleetVisualization = () => (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 20,
      padding: 30,
      color: 'white',
      marginBottom: 30,
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
          <div style={{ fontSize: 40, marginRight: 15 }}>🚗</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 24 }}>VMS Fleet Command Center</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Real-time fleet monitoring and management</p>
          </div>
        </div>
        
        <svg width="100%" height="200" viewBox="0 0 800 200">
          {/* Fleet visualization */}
          <defs>
            <linearGradient id="vehicleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4aa" />
              <stop offset="100%" stopColor="#01a085" />
            </linearGradient>
          </defs>
          
          {/* Available vehicles */}
          {Array.from({length: Math.min(availableVehicles.length, 10)}, (_, i) => (
            <g key={i}>
              <rect x={50 + i * 70} y={80} width={50} height={25} rx="5" fill="url(#vehicleGrad)" />
              <circle cx={60 + i * 70} cy={115} r="6" fill="#333" />
              <circle cx={90 + i * 70} cy={115} r="6" fill="#333" />
              <text x={75 + i * 70} y={98} textAnchor="middle" fill="white" fontSize="8">VEH</text>
            </g>
          ))}
          
          {/* GPS indicators */}
          <circle cx="100" cy="50" r="8" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="240" cy="45" r="8" fill="#ff6b6b">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="380" cy="55" r="8" fill="#ff6b6b">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          
          <text x="400" y="170" fill="rgba(255,255,255,0.8)" fontSize="12">Live Fleet Tracking Active</text>
        </svg>
      </div>
    </div>
  );

  const StatCard = ({ icon, title, value, color, subtitle }) => (
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
      <div style={{
        position: 'absolute',
        top: -10,
        right: -10,
        width: 60,
        height: 60,
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: '50%'
      }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginRight: 15
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#888' }}>{subtitle}</div>
      )}
    </div>
  );

  const renderOverview = () => {
    const groupedVehicles = groupVehiclesByOrg();
    const orgCount = Object.keys(groupedVehicles).length;
    
    return (
      <div style={{ padding: 30 }}>
        <FleetVisualization />
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 20, 
          marginBottom: 40 
        }}>
          <StatCard 
            icon="🚗" 
            title="Total Fleet" 
            value={allVehicles.length}
            color="#667eea"
            subtitle="All vehicles in system"
          />
          <StatCard 
            icon="✅" 
            title="Available Now" 
            value={availableVehicles.length}
            color="#10b981"
            subtitle="Ready for assignment"
          />
          <StatCard 
            icon="🏢" 
            title="Partner Assigned" 
            value={claimedVehicles.length}
            color="#f59e0b"
            subtitle="Currently in use"
          />
          <StatCard 
            icon="🤝" 
            title="Partner Companies" 
            value={orgCount}
            color="#8b5cf6"
            subtitle="Active partnerships"
          />
        </div>

        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 30,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 25px 0', color: '#1a1a2e', fontSize: 20 }}>
            🏢 Vehicles by Partner Organization
          </h3>
          
          {Object.keys(groupedVehicles).length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: '#666',
              background: '#f8f9ff',
              borderRadius: 12
            }}>
              <div style={{ fontSize: 48, marginBottom: 15 }}>🚗</div>
              <h4>No vehicles assigned yet</h4>
              <p>Partner companies haven't claimed any vehicles from the pool.</p>
            </div>
          ) : (
            Object.entries(groupedVehicles).map(([orgName, vehicles]) => (
              <div key={orgName} style={{ 
                marginBottom: 25, 
                border: '1px solid #e5e7eb', 
                borderRadius: 12, 
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
              }}>
                <div style={{ 
                  padding: 20, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, marginRight: 15 }}>🏢</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 18 }}>{orgName}</h4>
                      <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>{vehicles.length} vehicles assigned</p>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    Active Partner
                  </div>
                </div>
                
                <div style={{ padding: 20 }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 15 
                  }}>
                    {vehicles.map(vehicle => (
                      <div key={vehicle.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: 15,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      >
                        <div style={{ 
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 15,
                          fontSize: 16
                        }}>
                          🚗
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1a1a2e' }}>
                            {vehicle.license_plate || 'No Plate'} - {vehicle.make} {vehicle.model}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            VIN: {vehicle.vin.slice(0, 8)}...
                          </div>
                        </div>
                        <div style={{ 
                          padding: '4px 12px', 
                          backgroundColor: vehicle.status === 'AVAILABLE' ? '#10b981' : '#667eea',
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {vehicle.status || 'ASSIGNED'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAvailableVehicles = () => (
    <div style={{ padding: 30 }}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        borderRadius: 20,
        padding: 30,
        color: 'white',
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 24 }}>🚙 Available Fleet</h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            {availableVehicles.length} vehicles ready for partner assignment
          </p>
        </div>
        <div style={{ fontSize: 60, opacity: 0.7 }}>✅</div>
      </div>

      {availableVehicles.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🚗</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 10 }}>No Available Vehicles</h3>
          <p style={{ color: '#666' }}>All vehicles have been assigned to partner companies.</p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 30,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 20 
          }}>
            {availableVehicles.map(vehicle => (
              <div key={vehicle.id} style={{ 
                padding: 20,
                border: '2px solid #10b981',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600
                }}>
                  AVAILABLE
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981, #047857)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    marginRight: 15
                  }}>
                    🚗
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a1a2e' }}>
                      {vehicle.license_plate || 'No License Plate'}
                    </div>
                    <div style={{ color: '#047857', fontWeight: 600 }}>
                      {vehicle.make} {vehicle.model}
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  <div><strong>VIN:</strong> {vehicle.vin}</div>
                  {vehicle.year && <div><strong>Year:</strong> {vehicle.year}</div>}
                  {vehicle.mileage && <div><strong>Mileage:</strong> {vehicle.mileage.toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAllVehicles = () => (
    <div style={{ padding: 30 }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        padding: 30,
        color: 'white',
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 24 }}>📋 Complete Fleet Registry</h3>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            {allVehicles.length} total vehicles in VMS system
          </p>
        </div>
        <div style={{ fontSize: 60, opacity: 0.7 }}>🚗</div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 20 
        }}>
          {allVehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              padding: 20,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: vehicle.org ? 
                'linear-gradient(135deg, #fef3c7 0%, #fef7cd 100%)' : 
                'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 45,
                    height: 45,
                    borderRadius: 10,
                    background: vehicle.org ? 
                      'linear-gradient(135deg, #f59e0b, #d97706)' :
                      'linear-gradient(135deg, #10b981, #047857)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    marginRight: 12
                  }}>
                    🚗
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}>
                      {vehicle.license_plate || 'No License Plate'}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {vehicle.make} {vehicle.model}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '6px 12px', 
                  backgroundColor: vehicle.org ? '#f59e0b' : '#10b981',
                  color: 'white',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {vehicle.org ? 'PARTNER ASSIGNED' : 'AVAILABLE'}
                </div>
              </div>
              
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                <div><strong>VIN:</strong> {vehicle.vin}</div>
                {vehicle.year && <div><strong>Year:</strong> {vehicle.year}</div>}
                {vehicle.org && <div><strong>Partner:</strong> {getOrgName(vehicle.org)}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
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
        minHeight: 400
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
        <h3 style={{ color: '#667eea', margin: 0 }}>Loading Fleet Data...</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Gathering vehicle information from all partners</p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)' }}>
      {message && (
        <div style={{ 
          margin: '20px 30px',
          padding: 15, 
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: 12,
          border: '1px solid #fecaca'
        }}>
          ⚠️ {message}
        </div>
      )}

      {/* Enhanced Tab Navigation */}
      <div style={{ 
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 30px'
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'overview', label: '📊 Fleet Overview', icon: '📊' },
            { key: 'available', label: '✅ Available Vehicles', icon: '✅' },
            { key: 'all', label: '📋 All Vehicles', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '20px 30px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                backgroundColor: activeTab === tab.key ? '#f8f9ff' : 'transparent',
                color: activeTab === tab.key ? '#667eea' : '#666',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: activeTab === tab.key ? 700 : 500,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.backgroundColor = '#f8f9ff';
                  e.target.style.color = '#667eea';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#666';
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'available' && renderAvailableVehicles()}
      {activeTab === 'all' && renderAllVehicles()}
    </div>
  );
};

export default AdminVehicleOverview;