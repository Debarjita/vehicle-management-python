// frontend/src/components/UserList.js
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
      
      // Load users
      const usersRes = await axios.get('http://localhost:8000/api/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load organizations
      const orgsRes = await axios.get('http://localhost:8000/api/orgs-list/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
      
      // Reload data to get fresh state
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
      'ADMIN': '#dc3545',
      'ORG_MANAGER': '#007bff',
      'GUARD': '#28a745',
      'DRIVER': '#ffc107'
    };
    return colors[role] || '#6c757d';
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h2>User Management</h2>
        <p>Loading users...</p>
      </div>
    );
  }

  const groupedUsers = groupUsersByOrg();

  return (
    <div style={{ padding: 20 }}>
      <h2>User Management</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Manage user roles and organization assignments. Users are grouped by organization and role.
      </p>

      {message && (
        <div style={{ 
          padding: 10, 
          margin: '10px 0', 
          backgroundColor: message.includes('✅') ? '#e8f5e8' : '#ffebee',
          color: message.includes('✅') ? '#2e7d32' : '#c62828',
          borderRadius: 4 
        }}>
          {message}
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
        <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#dc3545' }}>{users.filter(u => u.role === 'ADMIN').length}</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Admins</p>
        </div>
        <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#007bff' }}>{users.filter(u => u.role === 'ORG_MANAGER').length}</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Org Managers</p>
        </div>
        <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#28a745' }}>{users.filter(u => u.role === 'GUARD').length}</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Guards</p>
        </div>
        <div style={{ padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4, textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#ffc107' }}>{users.filter(u => u.role === 'DRIVER').length}</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Drivers</p>
        </div>
      </div>

      {/* Organization-wise User Grid */}
      {Object.keys(groupedUsers).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <h3>No users found</h3>
          <p>Create some users to see them here.</p>
        </div>
      ) : (
        Object.entries(groupedUsers).map(([orgName, roleGroups]) => (
          <div key={orgName} style={{ marginBottom: 30, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: 15, backgroundColor: '#343a40', color: 'white' }}>
              <h3 style={{ margin: 0 }}>{orgName}</h3>
              <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
                {Object.values(roleGroups).flat().length} users
              </p>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {Object.entries(roleGroups).map(([role, roleUsers]) => (
                  <div key={role} style={{ border: '1px solid #eee', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      padding: 10, 
                      backgroundColor: getRoleColor(role), 
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold'
                    }}>
                      {role.replace('_', ' ')} ({roleUsers.length})
                    </div>
                    
                    <div style={{ padding: 10 }}>
                      {roleUsers.map((user, userIndex) => {
                        const globalIndex = users.findIndex(u => u.id === user.id);
                        return (
                          <div key={user.id} style={{ 
                            marginBottom: 10, 
                            padding: 10, 
                            backgroundColor: '#f8f9fa',
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                              {user.username}
                              <span style={{ 
                                marginLeft: 10, 
                                fontSize: 12, 
                                color: '#666' 
                              }}>
                                ID: {user.id}
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gap: 8 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
                                  Role:
                                </label>
                                <select 
                                  value={user.role} 
                                  onChange={(e) => handleChange(globalIndex, 'role', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: 4, 
                                    fontSize: 12,
                                    border: '1px solid #ddd',
                                    borderRadius: 3
                                  }}
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="ORG_MANAGER">Org Manager</option>
                                  <option value="GUARD">Guard</option>
                                  <option value="DRIVER">Driver</option>
                                </select>
                              </div>
                              
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
                                  Organization:
                                </label>
                                <select 
                                  value={user.org || ''} 
                                  onChange={(e) => handleChange(globalIndex, 'org', e.target.value)}
                                  style={{ 
                                    width: '100%', 
                                    padding: 4, 
                                    fontSize: 12,
                                    border: '1px solid #ddd',
                                    borderRadius: 3
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
                                marginTop: 8,
                                padding: 6, 
                                backgroundColor: updating[user.id] ? '#ccc' : '#007bff', 
                                color: 'white', 
                                border: 'none',
                                borderRadius: 3,
                                fontSize: 12,
                                cursor: updating[user.id] ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {updating[user.id] ? 'Updating...' : 'Update User'}
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
      <div style={{ marginTop: 30, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Quick Actions:</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={loadData}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserList;