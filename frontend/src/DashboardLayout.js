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
import UpdateOrgManagerPassword from './components/UpdateOrgManagerPassword';  // ✅ Use the correct import
import VehiclePool from './components/VehiclePool';

const sections = {
  vehicles: <AddVehicle />,
  vin: <VinDecode />,
  orgs: <OrgTree />,
  image: <UploadImage />,
  orgmgmt: <OrgManager />,
  vehiclelist: <VehicleList />,
  logentry: <LogEntry />,
  usercreate: <UserCreate />,
  userlist: <UserList />,
  orgregister: <UpdateOrgManagerPassword />, 
  vehiclepool: <VehiclePool />,
};

function DashboardLayout({ onLogout }) {
  const [active, setActive] = useState('vehicles');
  const role = localStorage.getItem('userRole');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, background: '#111', color: 'white', padding: 20 }}>
        <h3>VMS Panel</h3>

        {/* Role-based section buttons */}
        {Object.keys(sections).map((key) => {
          if (key === 'orgmgmt' && role !== 'ADMIN') return null;
          if (key === 'logentry' && role !== 'GUARD') return null;
          if (key === 'orgs' && !['ADMIN', 'ORG_MANAGER'].includes(role)) return null;
          if (key === 'usercreate' && role !== 'ADMIN') return null;
          if (key === 'userlist' && role !== 'ADMIN') return null;
          if (key === 'orgregister' && role !== 'ORG_MANAGER') return null;
          if (key === 'vehicles' && role !== 'ADMIN') return null;
          if (key === 'vin' && role !== 'ADMIN') return null;
          if (key === 'orgs' && role !== 'ADMIN') return null;
          if (key === 'image' && role !== 'ADMIN') return null;
          if (key === 'vehiclepool' && !['ORG_MANAGER', 'ADMIN'].includes(role)) return null;


          // You can customize the label for better clarity
          let label = key === 'orgregister' ? 'CHANGE PASSWORD' : key.toUpperCase();

          return (
            <div key={key}>
              <button
                style={{ width: '100%', margin: '5px 0' }}
                onClick={() => setActive(key)}
              >
                {label}
              </button>
            </div>
          );
        })}

        <hr />
        <button onClick={onLogout} style={{ backgroundColor: 'red', color: 'white' }}>
          Logout
        </button>
      </aside>

      <main style={{ flexGrow: 1, padding: 20 }}>
        {sections[active]}
      </main>
    </div>
  );
}

export default DashboardLayout;
