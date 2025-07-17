import React, { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import Login from './components/Login';
import DashboardLayout from './DashboardLayout';

function App() {
  const [currentView, setCurrentView] = useState('homepage');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  
  // Add this for debugging - remove in production
  useEffect(() => {
    // Force start from homepage on every app load (for development)
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      setLoggedIn(false);
      setCurrentView('homepage');
      setIsInitialized(true);
      console.log('Development mode: Force starting from homepage');
      return;
    }
  }, []);

  // Initialize app state on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    console.log('App initialization - Token:', !!token, 'Role:', userRole);
    
    // Only consider user logged in if both token and role exist AND are valid
    if (token && userRole && token.trim() !== '' && userRole.trim() !== '') {
      // Verify token is still valid by checking if it's not expired
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp && tokenPayload.exp > currentTime) {
          // Token is valid
          setLoggedIn(true);
          setCurrentView('dashboard');
          console.log('Valid session found, redirecting to dashboard');
        } else {
          // Token expired
          console.log('Token expired, clearing session');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('username');
          setLoggedIn(false);
          setCurrentView('homepage');
        }
      } catch (error) {
        // Invalid token format
        console.log('Invalid token format, clearing session');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        setLoggedIn(false);
        setCurrentView('homepage');
      }
    } else {
      // No valid credentials, clear everything and go to homepage
      console.log('No valid credentials found, going to homepage');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      setLoggedIn(false);
      setCurrentView('homepage');
    }
    
    setIsInitialized(true);
  }, []);

  const handleLogin = (loginData) => {
    // Store login data
    localStorage.setItem('accessToken', loginData.access);
    localStorage.setItem('userRole', loginData.role);
    localStorage.setItem('username', loginData.username);
    
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
    setCurrentView('login');
  };

  const showHomepage = () => {
    setCurrentView('homepage');
  };

  // Don't render anything until initialization is complete
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', fontSize: 16 }}>Loading VMS...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'homepage' && (
        <Homepage onLogin={handleLogin} />
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