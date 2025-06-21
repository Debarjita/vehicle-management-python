// frontend/src/DashboardLayout.js
import React, { useState } from 'react';
import AddVehicle from './components/AddVehicle';
import VinDecode from './components/VinDecode';
import OrgTree from './components/OrgTree';
import OrgManager from './OrgManager';
import LogEntry from './components/LogEntry';
import UserCreate from './components/UserCreate';
import UserList from './components/UserList';
import UpdateOrgManagerPassword from './components/UpdateOrgManagerPassword';
import VehiclePool from './components/VehiclePool';
import AdminVehicleOverview from './components/AdminVehicleOverview';
// ---- New Role Dashboards for RBAC ----
import OrgManagerDashboard from './components/OrgManagerDashboard';
import GuardDashboard from './components/GuardDashboard';
import DriverDashboard from './components/DriverDashboard';

// -- Define sections for each role --
const SECTIONS_BY_ROLE = {
  ADMIN: [
    { key: 'vehicle-overview', label: 'VEHICLE OVERVIEW', component: <AdminVehicleOverview /> },
    { key: 'add-vehicle', label: 'ADD VEHICLE', component: <AddVehicle /> },
    { key: 'vin-decode', label: 'VIN DECODE', component: <VinDecode /> },
    { key: 'user-management', label: 'MANAGE USERS', component: <UserList /> },
    { key: 'create-user', label: 'CREATE USER', component: <UserCreate /> },
    { key: 'org-tree', label: 'ORGANIZATION TREE', component: <OrgTree /> },
    { key: 'org-management', label: 'MANAGE ORGANIZATIONS', component: <OrgManager /> },
    { key: 'vehicle-pool', label: 'VEHICLE POOL', component: <VehiclePool /> },
  ],
  ORG_MANAGER: [
    { key: 'dashboard', label: 'DASHBOARD', component: <OrgManagerDashboard /> },
    { key: 'vehicle-pool', label: 'VEHICLE POOL', component: <VehiclePool /> },
    { key: 'user-management', label: 'MANAGE USERS', component: <UserList /> },
    { key: 'change-password', label: 'CHANGE PASSWORD', component: <UpdateOrgManagerPassword /> },
  ],
  GUARD: [
    { key: 'dashboard', label: 'DASHBOARD', component: <GuardDashboard /> },
    { key: 'log-entry', label: 'LOG ENTRY', component: <LogEntry /> },
  ],
  DRIVER: [
    { key: 'dashboard', label: 'DASHBOARD', component: <DriverDashboard /> },
  ],
};

function DashboardLayout({ onLogout }) {
  const role = localStorage.getItem('userRole');
  const username = localStorage.getItem('username') || 'User';
  const sections = SECTIONS_BY_ROLE[role] || [];
  const [active, setActive] = useState(sections[0]?.key || '');

  // Fallback if role is not recognized
  if (!role || sections.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Invalid role or access denied. Please log in again.</h2>
        <button onClick={onLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 280, background: '#2c3e50', color: 'white', padding: 20, overflowY: 'auto' }}>
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ margin: 0, color: '#ecf0f1', fontSize: 20 }}>VMS Panel</h3>
          <p style={{ margin: '5px 0 0 0', color: '#bdc3c7', fontSize: 14 }}>
            {role.replace('_', ' ')} - {username}
          </p>
        </div>
        
        {sections.map(({ key, label }) => (
          <div key={key}>
            <button
              style={{
                width: '100%',
                margin: '3px 0',
                background: active === key ? '#34495e' : 'transparent',
                color: active === key ? '#3498db' : '#ecf0f1',
                padding: '12px 16px',
                border: active === key ? '1px solid #3498db' : '1px solid transparent',
                borderRadius: 6,
                fontWeight: active === key ? 700 : 500,
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActive(key)}
              onMouseEnter={(e) => {
                if (active !== key) {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (active !== key) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {label}
            </button>
          </div>
        ))}
        
        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #34495e' }} />
        
        <button 
          onClick={onLogout} 
          style={{ 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ flexGrow: 1, padding: 0, backgroundColor: '#f8f9fa', overflowY: 'auto' }}>
        <div style={{ padding: 0 }}>
          {sections.find((s) => s.key === active)?.component || <div>Select a section</div>}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;