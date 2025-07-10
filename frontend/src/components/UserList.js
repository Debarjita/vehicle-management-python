// frontend/src/components/UserList.js - ENHANCED WITH PROFESSIONAL STYLING
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  const token = localStorage.getItem('accessToken');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [usersRes, orgsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/users/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setUsers(usersRes.data || []);
      
      // Flatten organizations
      const flat = [];
      const flatten = nodes => {
        nodes.forEach(n => {
          flat.push({ id: n.id, name: n.name });
          if (n.children) flatten(n.children);
        });
      };
      flatten(orgsRes.data || []);
      setOrgs(flat);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Failed to load data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const handleUpdate = async (user, index) => {
    setUpdating({ ...updating, [user.id]: true });
    
    try {
      await axios.patch(`http://localhost:8000/api/users/${user.id}/`, {
        role: user.role,
        org: user.org || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Updated ${user.username}`);
      
      await loadData();
      
    } catch (err) {
      console.error('Update error:', err);
      setMessage('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating({ ...updating, [user.id]: false });
    }
  };

  const groupUsersByOrg = () => {
    const grouped = {};
    users.forEach(user => {
      const orgName = user.org_name || 'No Organization';
      if (!grouped[orgName]) {
        grouped[orgName] = {};
      }
      if (!grouped[orgName][user.role]) {
        grouped[orgName][user.role] = [];
      }
      grouped[orgName][user.role].push(user);
    });
    return grouped;
  };

  const getRoleColor = (role) => {
    const colors = {
      'ADMIN': '#667eea',
      'ORG_MANAGER': '#f093fb',
      'GUARD': '#4facfe',
      'DRIVER': '#43e97b'
    };
    return colors[role] || '#6c757d';
  };

  const getRoleIcon = (role) => {
    const icons = {
      'ADMIN': '👨‍💼',
      'ORG_MANAGER': '👨‍💻',
      'GUARD': '👮‍♂️',
      'DRIVER': '🚗'
    };
    return icons[role] || '👤';
  };

  const StatCard = ({ title, count, color, icon }) => (
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
        background: `${color}20`,
        borderRadius: '50%'
      }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
        <div style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: color,
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
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{count}</div>
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
        <h3 style={{ color: '#667eea', margin: 0 }}>Loading User Data...</h3>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>Gathering information from all partners</p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const groupedUsers = groupUsersByOrg();

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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
            <div style={{ fontSize: 40, marginRight: 15 }}>👥</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>User Management Center</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                Manage user roles and organization assignments across all partners
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: 15, 
          margin: '0 0 30px 0', 
          backgroundColor: message.includes('✅') ? '#ecfdf5' : '#fef2f2',
          color: message.includes('✅') ? '#065f46' : '#dc2626',
          borderRadius: 12,
          border: `1px solid ${message.includes('✅') ? '#a7f3d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{ fontSize: 18 }}>
            {message.includes('✅') ? '✅' : '⚠️'}
          </div>
          <div>{message}</div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 20, 
        marginBottom: 40 
      }}>
        <StatCard 
          title="Administrators" 
          count={users.filter(u => u.role === 'ADMIN').length}
          color="#667eea"
          icon="👨‍💼"
        />
        <StatCard 
          title="Org Managers" 
          count={users.filter(u => u.role === 'ORG_MANAGER').length}
          color="#f093fb"
          icon="👨‍💻"
        />
        <StatCard 
          title="Security Guards" 
          count={users.filter(u => u.role === 'GUARD').length}
          color="#4facfe"
          icon="👮‍♂️"
        />
        <StatCard 
          title="Drivers" 
          count={users.filter(u => u.role === 'DRIVER').length}
          color="#43e97b"
          icon="🚗"
        />
      </div>

      {/* Organization-wise User Grid */}
      {Object.keys(groupedUsers).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 60,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>👥</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 10 }}>No Users Found</h3>
          <p style={{ color: '#666' }}>Create some users to see them here.</p>
        </div>
      ) : (
        Object.entries(groupedUsers).map(([orgName, roleGroups]) => (
          <div key={orgName} style={{ 
            marginBottom: 30, 
            background: 'white',
            borderRadius: 20, 
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ 
              padding: 25, 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: 30, marginRight: 15 }}>🏢</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{orgName}</h3>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: 14 }}>
                    {Object.values(roleGroups).flat().length} team members
                  </p>
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}>
                Partner Organization
              </div>
            </div>
            
            <div style={{ padding: 30 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: 25 
              }}>
                {Object.entries(roleGroups).map(([role, roleUsers]) => (
                  <div key={role} style={{ 
                    border: `2px solid ${getRoleColor(role)}20`,
                    borderRadius: 16, 
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${getRoleColor(role)}05, ${getRoleColor(role)}02)`
                  }}>
                    <div style={{ 
                      padding: 20, 
                      background: getRoleColor(role),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <div style={{ fontSize: 24 }}>{getRoleIcon(role)}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                          {role.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                          {roleUsers.length} member{roleUsers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ padding: 20 }}>
                      {roleUsers.map((user) => {
                        const globalIndex = users.findIndex(u => u.id === user.id);
                        return (
                          <div key={user.id} style={{ 
                            marginBottom: 20, 
                            padding: 20, 
                            background: 'white',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              marginBottom: 15 
                            }}>
                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: getRoleColor(role),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                marginRight: 12
                              }}>
                                {getRoleIcon(role)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a1a2e' }}>
                                  {user.username}
                                </div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1fr 1fr',
                              gap: 15, 
                              marginBottom: 15 
                            }}>
                              <div>
                                <label style={{ 
                                  display: 'block', 
                                  fontSize: 12, 
                                  fontWeight: 'bold', 
                                  marginBottom: 5,
                                  color: '#374151'
                                }}>
                                  Role:
                                </label>
                                <select 
                                  value={user.role} 
                                  onChange={(e) => handleChange(globalIndex, 'role', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: 8, 
                                    fontSize: 13,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    background: 'white'
                                  }}
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="ORG_MANAGER">Org Manager</option>
                                  <option value="GUARD">Guard</option>
                                  <option value="DRIVER">Driver</option>
                                </select>
                              </div>
                              
                              <div>
                                <label style={{ 
                                  display: 'block', 
                                  fontSize: 12, 
                                  fontWeight: 'bold', 
                                  marginBottom: 5,
                                  color: '#374151'
                                }}>
                                  Organization:
                                </label>
                                <select 
                                  value={user.org || ''} 
                                  onChange={(e) => handleChange(globalIndex, 'org', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: 8, 
                                    fontSize: 13,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    background: 'white'
                                  }}
                                >
                                  <option value="">No Organization</option>
                                  {orgs.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleUpdate(user, globalIndex)}
                              disabled={updating[user.id]}
                              style={{ 
                                width: '100%',
                                padding: 12, 
                                background: updating[user.id] 
                                  ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                                  : `linear-gradient(135deg, ${getRoleColor(role)}, ${getRoleColor(role)}dd)`, 
                                color: 'white', 
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: updating[user.id] ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!updating[user.id]) {
                                  e.target.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              {updating[user.id] ? '⏳ Updating...' : '💾 Update User'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Quick Actions */}
      <div style={{ 
        background: 'white',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#1a1a2e' }}>Quick Actions</h4>
        <button 
          onClick={loadData}
          disabled={loading}
          style={{ 
            padding: '12px 30px', 
            background: loading 
              ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
              : 'linear-gradient(135deg, #10b981, #047857)', 
            color: 'white', 
            border: 'none',
            borderRadius: 25,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh All Data'}
        </button>
      </div>
    </div>
  );
}

export default UserList;