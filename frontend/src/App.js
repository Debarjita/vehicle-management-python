import React, { useState } from 'react';
import Homepage from './components/Homepage';
import Login from './components/Login';
import DashboardLayout from './DashboardLayout';

function App() {
  const [currentView, setCurrentView] = useState('homepage');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('accessToken'));

  const handleLogin = () => {
    setLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setLoggedIn(false);
    setCurrentView('homepage');
  };

  const showLogin = () => {
    // Check if user is already logged in, if so go directly to dashboard
    if (localStorage.getItem('accessToken')) {
      setLoggedIn(true);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
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
        <Homepage onShowLogin={handleLogin} />
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