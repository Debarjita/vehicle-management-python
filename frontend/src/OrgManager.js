import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrgManager() {
  const [form, setForm] = useState({
    name: '',
    account: '',
    website: '',
    fuelReimbursementPolicy: '',
    speedLimitPolicy: '',
    parent: ''
  });
  const [mode, setMode] = useState('create');
  const [message, setMessage] = useState('');
  const [orgList, setOrgList] = useState([]);

  useEffect(() => {
    const fetchOrgs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Token ${token}` }
        });
        setOrgList(flattenOrgs(res.data)); // use flat list
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrgs();
  }, []);

  const flattenOrgs = (nodes) => {
    const result = [];
    const traverse = (list) => {
      list.forEach(node => {
        result.push({ id: node.id, name: node.name });
        if (node.children) traverse(node.children);
      });
    };
    traverse(nodes);
    return result;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    try {
      if (mode === 'create') {
        const body = { ...form };
        if (!body.fuelReimbursementPolicy) body.fuelReimbursementPolicy = '1000';
        if (body.parent === '') {
          body.parent = null;
        } else {
          body.parent = parseInt(body.parent);  
        }
        console.log('Submitting org:', body);

        await axios.post('http://localhost:8000/api/orgs/', body, {
        headers: { Authorization: `Token ${token}` }
        });
        setMessage('Organization created ✅');
      } else {
          await axios.patch(`http://localhost:8000/api/orgs/${form.id}/`, form, {
          headers: { Authorization: `Token ${token}` }
        });
        setMessage('Organization patched ✅');
      }
    } catch (err) {
      console.log('Error details:', err.response?.data);
      setMessage('❌ Error: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h2>{mode === 'create' ? 'Create Organization' : 'Patch Organization'}</h2>
      <div>
        <button onClick={() => setMode('create')}>Create Mode</button>
        <button onClick={() => setMode('patch')}>Patch Mode</button>
      </div>
      {mode === 'patch' && (
        <select name="id" value={form.id} onChange={handleChange}>
          <option value="">Select organization to patch</option>
          {orgList.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />

      {mode === 'create' && (
        <select name="parent" value={form.parent} onChange={handleChange}>
          <option value="">No Parent</option>
          {orgList.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}
            
      <input name="account" placeholder="Account" value={form.account} onChange={handleChange} />
      <input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
      <input name="fuelReimbursementPolicy" placeholder="Fuel Reimbursement Policy" value={form.fuelReimbursementPolicy} onChange={handleChange} />
      <input name="speedLimitPolicy" placeholder="Speed Limit Policy" value={form.speedLimitPolicy} onChange={handleChange} />
      {mode === 'create' && (
        <input name="parent" placeholder="Parent Org Name (optional)" value={form.parent} onChange={handleChange} />
      )}
      <br />
      <button onClick={handleSubmit}>{mode === 'create' ? 'Create' : 'Patch'}</button>
      <p>{message}</p>
    </div>
  );
}

export default OrgManager;
