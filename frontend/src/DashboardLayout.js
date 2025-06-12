// src/DashboardLayout.js
import React, { useState } from 'react';
import AddVehicle from './components/AddVehicle';
import VinDecode from './components/VinDecode';
import OrgTree from './components/OrgTree';
import UploadImage from './UploadImage';
import OrgManager from './OrgManager';
import VehicleList from './components/VehicleList';

const sections = {
  vehicles: <AddVehicle />,
  vin: <VinDecode />,
  orgs: <OrgTree />,
  image: <UploadImage />,
  orgmgmt: <OrgManager />,
  vehiclelist: <VehicleList /> // ✅ Add this line here
};


function DashboardLayout({ onLogout }) {
  const [active, setActive] = useState('vehicles');
  

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, background: '#111', color: 'white', padding: 20 }}>
        <h3>VMS Panel</h3>
        {Object.keys(sections).map(key => (
          <div key={key}>
            <button
              style={{ width: '100%', margin: '5px 0' }}
              onClick={() => setActive(key)}
            >
              {key.toUpperCase()}
            </button>
          </div>
        ))}
        <hr />
        <button onClick={onLogout} style={{ backgroundColor: 'red', color: 'white' }}>Logout</button>
      </aside>
      <main style={{ flexGrow: 1, padding: 20 }}>
        {sections[active]}
      </main>
    </div>
  );
}

export default DashboardLayout;
