import React, { useEffect, useState } from 'react';
import axios from 'axios';

function OrgTree() {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    const fetchOrgs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://localhost:8000/api/orgs-list/', {
          headers: { Authorization: `Token ${token}` }
        });
        setOrgs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrgs();
  }, []);

  const renderOrg = (org, depth = 0) => (
    <div key={org.name} style={{ marginLeft: depth * 20, borderLeft: '2px solid #ccc', paddingLeft: 10 }}>
      <p><strong>{org.name}</strong> — {org.account}</p>
      <p>🌐 {org.website}</p>
      <p>⛽ Fuel Policy: <strong>{org.resolved_fuel_policy}</strong></p>
      <p>🚦 Speed Policy: <strong>{org.resolved_speed_policy}</strong></p>
      {org.children && org.children.map(child => renderOrg(child, depth + 1))}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Organization Tree</h2>
      {orgs.map(org => renderOrg(org))}
    </div>
  );
}

export default OrgTree;
