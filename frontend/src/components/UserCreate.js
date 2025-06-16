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

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    axios.get('http://localhost:8000/api/orgs-list/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const flatOrgs = [];
      const flatten = (nodes) => {
        nodes.forEach(node => {
          flatOrgs.push({ id: node.id, name: node.name });
          if (node.children) flatten(node.children);
        });
      };
      flatten(res.data);
      setOrgs(flatOrgs);
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      await axios.post('http://localhost:8000/api/create-user/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ User ${form.username} created`);
    } catch (err) {
      setMessage('❌ Error: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h2>Create User</h2>
      <input name="username" placeholder="Username" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <select name="role" value={form.role} onChange={handleChange}>
        <option value="DRIVER">Driver</option>
        <option value="GUARD">Guard</option>
        <option value="ORG_MANAGER">Org Manager</option>
        <option value="ADMIN">Admin</option>
      </select>
      {form.role !== 'ADMIN' && (
        <select name="org" value={form.org} onChange={handleChange}>
          <option value="">Select Org</option>
          {orgs.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}
      <button onClick={handleSubmit}>Create User</button>
      <p>{message}</p>
    </div>
  );
}

export default UserCreate;
