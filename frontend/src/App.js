import React, { useState } from 'react';
import Login from './components/Login';
import DashboardLayout from './DashboardLayout';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <>
      {loggedIn ? (
        <DashboardLayout onLogout={handleLogout} />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </>
  );
}

export default App;
