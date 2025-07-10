// frontend/src/DashboardLayout.js - ENHANCED WITH CAPTIVATING UI
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
import OrgManagerDashboard from './components/OrgManagerDashboard';
import GuardDashboard from './components/GuardDashboard';
import DriverDashboard from './components/DriverDashboard';

const SECTIONS_BY_ROLE = {
  ADMIN: [
    { key: 'vehicle-overview', label: '🚗 FLEET OVERVIEW', component: <AdminVehicleOverview /> },
    { key: 'add-vehicle', label: '➕ ADD VEHICLE', component: <AddVehicle /> },
    { key: 'vin-decode', label: '🔍 VIN DECODER', component: <VinDecode /> },
    { key: 'user-management', label: '👥 MANAGE USERS', component: <UserList /> },
    { key: 'create-user', label: '✨ CREATE USER', component: <UserCreate /> },
    { key: 'org-tree', label: '🏢 PARTNER TREE', component: <OrgTree /> },
    { key: 'org-management', label: '🏗️ MANAGE PARTNERS', component: <OrgManager /> },
    { key: 'vehicle-pool', label: '🚙 VEHICLE POOL', component: <VehiclePool /> },
  ],
  ORG_MANAGER: [
    { key: 'dashboard', label: '📊 DASHBOARD', component: <OrgManagerDashboard /> },
    { key: 'vehicle-pool', label: '🚙 FLEET ACCESS', component: <VehiclePool /> },
    { key: 'user-management', label: '👥 TEAM MANAGEMENT', component: <UserList /> },
    { key: 'change-password', label: '🔐 ACCOUNT SETTINGS', component: <UpdateOrgManagerPassword /> },
  ],
  GUARD: [
    { key: 'dashboard', label: '🛡️ SECURITY CENTER', component: <GuardDashboard /> },
    { key: 'log-entry', label: '📝 VEHICLE LOGS', component: <LogEntry /> },
  ],
  DRIVER: [
    { key: 'dashboard', label: '🚗 MY DASHBOARD', component: <DriverDashboard /> },
  ],
};

function DashboardLayout({ onLogout }) {
  const role = localStorage.getItem('userRole');
  const username = localStorage.getItem('username') || 'User';
  const sections = SECTIONS_BY_ROLE[role] || [];
  const [active, setActive] = useState(sections[0]?.key || '');

  if (!role || sections.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          background: 'white',
          padding: 40,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#667eea', marginBottom: 20 }}>🚫 Access Denied</h2>
          <p style={{ color: '#666', marginBottom: 30 }}>Invalid role or access denied. Please log in again.</p>
          <button 
            onClick={onLogout}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: 25,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const getRoleInfo = () => {
    switch(role) {
      case 'ADMIN':
        return { 
          title: 'VMS Fleet Control Center', 
          subtitle: 'Complete Fleet & Partner Management',
          icon: '👨‍💼',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };
      case 'ORG_MANAGER':
        return { 
          title: 'Partner Operations Center', 
          subtitle: 'Team & Vehicle Management',
          icon: '👨‍💻',
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        };
      case 'GUARD':
        return { 
          title: 'Security Command Center', 
          subtitle: 'Vehicle Access & Monitoring',
          icon: '👮‍♂️',
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };
      case 'DRIVER':
        return { 
          title: 'Driver Portal', 
          subtitle: 'Your Schedule & Vehicle Info',
          icon: '🚗',
          gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        };
      default:
        return { 
          title: 'Dashboard', 
          subtitle: 'Welcome',
          icon: '📊',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9ff' }}>
      {/* Enhanced Sidebar */}
      <aside style={{ 
        width: 320,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        padding: 0,
        overflowY: 'auto',
        boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
      }}>
        {/* Header Section */}
        <div style={{ 
          padding: 30,
          background: roleInfo.gradient,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            fontSize: 60,
            textAlign: 'center',
            marginBottom: 15,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}>
            {roleInfo.icon}
          </div>
          <h3 style={{ 
            margin: 0, 
            fontSize: 18,
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {roleInfo.title}
          </h3>
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: 14,
            opacity: 0.9,
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {roleInfo.subtitle}
          </p>
          <div style={{
            marginTop: 15,
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}>
            {username}
          </div>
        </div>
        
        {/* Navigation Menu */}
        <div style={{ padding: '20px 0' }}>
          {sections.map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 4 }}>
              <button
                style={{
                  width: '100%',
                  background: active === key 
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'transparent',
                  color: active === key ? '#fff' : '#b8c5d6',
                  padding: '16px 30px',
                  border: 'none',
                  borderLeft: active === key ? '4px solid #00d4aa' : '4px solid transparent',
                  fontWeight: active === key ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: 14,
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => setActive(key)}
                onMouseEnter={(e) => {
                  if (active !== key) {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (active !== key) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#b8c5d6';
                  }
                }}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
        
        {/* Footer Section */}
        <div style={{ padding: 30 }}>
          <div style={{
            padding: 20,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 15,
            marginBottom: 20,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 10 }}>⚡</div>
            <div style={{ fontSize: 12, textAlign: 'center', opacity: 0.8 }}>
              Fleet Status: Online
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', opacity: 0.8 }}>
              Last Sync: {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <button 
            onClick={onLogout} 
            style={{ 
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              color: 'white', 
              width: '100%',
              padding: 16,
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(238, 90, 82, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(238, 90, 82, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(238, 90, 82, 0.3)';
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Enhanced Main Content */}
      <main style={{ 
        flexGrow: 1, 
        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          background: roleInfo.gradient,
          clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)',
          opacity: 0.1
        }}></div>

        {/* Content Header */}
        <div style={{ 
          position: 'relative',
          padding: '40px 40px 20px 40px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,255,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ 
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                background: roleInfo.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {sections.find(s => s.key === active)?.label || 'Dashboard'}
              </h1>
              <p style={{ 
                margin: '8px 0 0 0',
                color: '#6b7280',
                fontSize: 16
              }}>
                Welcome back, {username} • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{
                padding: '8px 16px',
                background: roleInfo.gradient,
                borderRadius: 20,
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                {role.replace('_', ' ')}
              </div>
              
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                animation: 'pulse 2s infinite'
              }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          padding: 0,
          position: 'relative',
          minHeight: 'calc(100vh - 140px)'
        }}>
          {sections.find((s) => s.key === active)?.component || (
            <div style={{ 
              padding: 40,
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: 60, marginBottom: 20 }}>🚀</div>
              <h3>Select a section to get started</h3>
              <p>Choose from the navigation menu to access your tools and features.</p>
            </div>
          )}
        </div>

        {/* Floating Elements */}
        <div style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          zIndex: 1000
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: roleInfo.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
          >
            💬
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </main>
    </div>
  );
}

export default DashboardLayout;