// frontend/src/components/UserCreate.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserCreate() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'DRIVER',
    org: ''
  });
  const [orgs, setOrgs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const flatOrgs = [];
        const flatten = (nodes) => {
          nodes.forEach(node => {
            flatOrgs.push({ id: node.id, name: node.name });
            if (node.children) flatten(node.children);
          });
        };
        flatten(response.data || []);
        setOrgs(flatOrgs);
        
      } catch (error) {
        console.error('Error loading organizations:', error);
        setMessage('Failed to load organizations');
      }
    };

    loadOrganizations();
  }, [token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.username || !form.password || !form.role) {
      setMessage('❌ Please fill in all required fields');
      return;
    }

    if (form.role !== 'ADMIN' && !form.org) {
      setMessage('❌ Organization is required for non-admin users');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:8000/api/create-user/', form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessage(`✅ User ${form.username} created successfully!`);
      console.log('User created:', response.data);
      
      // Reset form
      setForm({
        username: '',
        password: '',
        role: 'DRIVER',
        org: ''
      });
      
    } catch (err) {
      console.error('Create user error:', err);
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      err.message || 
                      'Failed to create user';
      setMessage('❌ Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>Create User</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Create new users with specific roles and organization assignments.
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Username *
          </label>
          <input 
            name="username" 
            placeholder="Enter username" 
            value={form.username}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: 10, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              fontSize: 14
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Password *
          </label>
          <input 
            name="password" 
            type="password" 
            placeholder="Enter password" 
            value={form.password}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: 10, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              fontSize: 14
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Role *
          </label>
          <select 
            name="role" 
            value={form.role} 
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: 10, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              fontSize: 14
            }}
          >
            <option value="DRIVER">Driver</option>
            <option value="GUARD">Guard</option>
            <option value="ORG_MANAGER">Organization Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {form.role !== 'ADMIN' && (
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Organization * (Required for non-admin users)
            </label>
            <select 
              name="org" 
              value={form.org} 
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
              required={form.role !== 'ADMIN'}
            >
              <option value="">Select Organization</option>
              {orgs.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          style={{ 
            padding: 12, 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating User...' : 'Create User'}
        </button>
      </form>

      <div style={{ marginTop: 30, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Role Descriptions:</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#666' }}>
          <li><strong>Admin:</strong> Full system access, can manage all organizations and users</li>
          <li><strong>Organization Manager:</strong> Manages users and vehicles within their organization</li>
          <li><strong>Guard:</strong> Records attendance and verifies driver-vehicle assignments</li>
          <li><strong>Driver:</strong> Views schedule and attendance history</li>
        </ul>
      </div>
    </div>
  );
}

export default UserCreate;