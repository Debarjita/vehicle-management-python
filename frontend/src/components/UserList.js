import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    axios.get('http://localhost:8000/api/users/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsers(res.data));

    axios.get('http://localhost:8000/api/orgs-list/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const flat = [];
      const flatten = nodes => {
        nodes.forEach(n => {
          flat.push({ id: n.id, name: n.name });
          if (n.children) flatten(n.children);
        });
      };
      flatten(res.data);
      setOrgs(flat);
    });
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
  };

  const handleUpdate = async (user) => {
    const token = localStorage.getItem('accessToken');
    try {
      await axios.patch(`http://localhost:8000/api/users/${user.id}/`, {
        role: user.role,
        org: user.org
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Updated ${user.username}`);
    } catch (err) {
      setMessage('❌ Error: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h2>Manage Users</h2>
      {users.map((user, idx) => (
        <div key={user.id} style={{ marginBottom: 10, border: '1px solid #ccc', padding: 10 }}>
          <b>{user.username}</b>
          <select value={user.role} onChange={(e) => handleChange(idx, 'role', e.target.value)}>
            <option value="ADMIN">Admin</option>
            <option value="GUARD">Guard</option>
            <option value="DRIVER">Driver</option>
            <option value="ORG_MANAGER">Org Manager</option>
          </select>
          <select value={user.org || ''} onChange={(e) => handleChange(idx, 'org', e.target.value)}>
            <option value="">No Org</option>
            {orgs.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <button onClick={() => handleUpdate(user)}>Update</button>
        </div>
      ))}
      <p>{message}</p>
    </div>
  );
}

export default UserList;

