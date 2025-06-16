import React, { useState } from 'react';
import AddVehicle from './components/AddVehicle';
import VinDecode from './components/VinDecode';
import OrgTree from './components/OrgTree';
import UploadImage from './UploadImage';
import OrgManager from './OrgManager';
import VehicleList from './components/VehicleList';
import LogEntry from './components/LogEntry';
import UserCreate from './components/UserCreate';
import UserList from './components/UserList';
import UpdateOrgManagerPassword from './components/UpdateOrgManagerPassword';
import VehiclePool from './components/VehiclePool';
// ---- New Role Dashboards for RBAC ----
import OrgManagerDashboard from './components/OrgManagerDashboard';
import GuardDashboard from './components/GuardDashboard';
import DriverDashboard from './components/DriverDashboard';

// -- Define sections for each role --
const SECTIONS_BY_ROLE = {
  ADMIN: [
    { key: 'vehicles', label: 'ADD VEHICLE', component: <AddVehicle /> },
    { key: 'vin', label: 'VIN DECODE', component: <VinDecode /> },
    { key: 'orgs', label: 'ORG TREE', component: <OrgTree /> },
    { key: 'image', label: 'UPLOAD IMAGE', component: <UploadImage /> },
    { key: 'orgmgmt', label: 'ORG MGMT', component: <OrgManager /> },
    { key: 'vehiclelist', label: 'VEHICLE LIST', component: <VehicleList /> },
    { key: 'usercreate', label: 'CREATE USER', component: <UserCreate /> },
    { key: 'userlist', label: 'USER LIST', component: <UserList /> },
    { key: 'vehiclepool', label: 'VEHICLE POOL', component: <VehiclePool /> },
  ],
  ORG_MANAGER: [
    { key: 'dashboard', label: 'DASHBOARD', component: <OrgManagerDashboard /> },
    { key: 'vehiclepool', label: 'VEHICLE POOL', component: <VehiclePool /> },
    { key: 'userlist', label: 'USER LIST', component: <UserList /> },
    { key: 'orgregister', label: 'CHANGE PASSWORD', component: <UpdateOrgManagerPassword /> },
  ],
  GUARD: [
    { key: 'dashboard', label: 'DASHBOARD', component: <GuardDashboard /> },
    { key: 'logentry', label: 'LOG ENTRY', component: <LogEntry /> },
  ],
  DRIVER: [
    { key: 'dashboard', label: 'DASHBOARD', component: <DriverDashboard /> },
  ],
};

function DashboardLayout({ onLogout }) {
  const role = localStorage.getItem('userRole');
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
      <aside style={{ width: 220, background: '#111', color: 'white', padding: 20 }}>
        <h3>VMS Panel</h3>
        {sections.map(({ key, label }) => (
          <div key={key}>
            <button
              style={{
                width: '100%',
                margin: '5px 0',
                background: active === key ? '#222' : '',
                color: 'white',
                padding: '8px 0',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          </div>
        ))}
        <hr />
        <button onClick={onLogout} style={{ backgroundColor: 'red', color: 'white', width: '100%' }}>
          Logout
        </button>
      </aside>

      <main style={{ flexGrow: 1, padding: 20 }}>
        {sections.find((s) => s.key === active)?.component || <div>Select a section</div>}
      </main>
    </div>
  );
}

export default DashboardLayout;
