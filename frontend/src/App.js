import React, { useState } from 'react';
import Homepage from './components/Homepage';
import Login from './components/Login';
import DashboardLayout from './DashboardLayout';

function App() {
  const [currentView, setCurrentView] = useState('homepage');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => {
    setLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setLoggedIn(false);
    setCurrentView('homepage');
  };

  const showLogin = () => {
    setCurrentView('login');
  };

  const showHomepage = () => {
    setCurrentView('homepage');
  };

  // If user is already logged in, go straight to dashboard
  if (loggedIn && currentView !== 'dashboard') {
    setCurrentView('dashboard');
  }

  return (
    <div className="App">
      {currentView === 'homepage' && (
        <Homepage onShowLogin={showLogin} />
      )}
      {currentView === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onBackToHome={showHomepage}
        />
      )}
      {currentView === 'dashboard' && loggedIn && (
        <DashboardLayout onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;