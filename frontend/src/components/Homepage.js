// frontend/src/components/Homepage.js - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import './Homepage.css';

const Homepage = ({ onShowLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({
    role: '',
    username: '',
    password: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle login
  const handleLogin = async () => {
    if (!loginForm.role || !loginForm.username || !loginForm.password) {
      setLoginError('Please fill in all fields');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('username', data.username);
        
        setShowLoginModal(false);
        onShowLogin(); // Navigate to dashboard
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('Network error. Please check your connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  const selectRole = (role) => {
    setLoginForm({ ...loginForm, role });
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({ role: '', username: '', password: '' });
    setLoginError('');
  };

  // Smooth scrolling
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 30px rgba(124, 58, 237, 0.15)';
      } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(124, 58, 237, 0.1)';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating elements animation
  useEffect(() => {
    const createFloatingElement = () => {
      const element = document.createElement('div');
      element.innerHTML = ['🚗', '📊', '🤖', '🔐', '📱', '⚡'][Math.floor(Math.random() * 6)];
      element.style.cssText = `
        position: fixed;
        font-size: 2rem;
        opacity: 0.1;
        pointer-events: none;
        z-index: -1;
        animation: float-up 15s linear infinite;
      `;
      
      element.style.left = Math.random() * 100 + 'vw';
      element.style.top = '100vh';
      
      document.body.appendChild(element);
      
      setTimeout(() => {
        element.remove();
      }, 15000);
    };

    const interval = setInterval(createFloatingElement, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <nav className="container nav">
          <div className="logo">🚗 VMS</div>
          <ul className="nav-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>User Roles</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            <li>
              <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                Login
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Smart Vehicle Management<br/>Made Simple</h1>
            <p>Streamline your fleet operations with our comprehensive Vehicle Management System. Track, manage, and optimize your vehicles with real-time insights and AI-powered scheduling.</p>
            
            <div className="cta-buttons">
              <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
                Get Started
              </button>
              <button className="btn btn-secondary" onClick={() => scrollToSection('features')}>
                Learn More
              </button>
            </div>

            <div className="hero-image">
              <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="800" height="400" fill="url(#gradient1)"/>
                
                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#f8f9ff',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#e5e7eb',stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#7c3aed',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#a855f7',stopOpacity:1}} />
                  </linearGradient>
                </defs>
                
                {/* Buildings */}
                <rect x="50" y="150" width="120" height="200" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="200" y="100" width="150" height="250" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="400" y="120" width="130" height="230" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="580" y="140" width="140" height="210" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
                
                {/* Windows */}
                <rect x="70" y="170" width="15" height="15" fill="#7c3aed"/>
                <rect x="100" y="170" width="15" height="15" fill="#7c3aed"/>
                <rect x="130" y="170" width="15" height="15" fill="#7c3aed"/>
                
                {/* Vehicles */}
                <rect x="100" y="320" width="60" height="25" rx="5" fill="url(#gradient2)"/>
                <circle cx="115" cy="350" r="8" fill="#374151"/>
                <circle cx="145" cy="350" r="8" fill="#374151"/>
                
                <rect x="250" y="315" width="70" height="30" rx="5" fill="#a855f7"/>
                <circle cx="270" cy="350" r="8" fill="#374151"/>
                <circle cx="310" cy="350" r="8" fill="#374151"/>
                
                <rect x="450" y="318" width="65" height="27" rx="5" fill="#7c3aed"/>
                <circle cx="467" cy="350" r="8" fill="#374151"/>
                <circle cx="498" cy="350" r="8" fill="#374151"/>
                
                {/* GPS Icons */}
                <circle cx="130" cy="300" r="20" fill="#ef4444" opacity="0.8"/>
                <text x="130" y="306" textAnchor="middle" fill="white" fontSize="12">📍</text>
                
                <circle cx="285" cy="295" r="20" fill="#ef4444" opacity="0.8"/>
                <text x="285" y="301" textAnchor="middle" fill="white" fontSize="12">📍</text>
                
                {/* WiFi Signal */}
                <circle cx="500" cy="280" r="25" fill="#10b981" opacity="0.3"/>
                <text x="500" y="286" textAnchor="middle" fill="#10b981" fontSize="16">📶</text>
                
                {/* Dashboard Screens */}
                <rect x="600" y="50" width="150" height="100" rx="10" fill="white" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="610" y="65" width="130" height="3" fill="#7c3aed"/>
                <rect x="610" y="75" width="100" height="3" fill="#a855f7"/>
                <rect x="610" y="85" width="120" height="3" fill="#c084fc"/>
                
                {/* Connecting Lines */}
                <path d="M 130 300 Q 300 250 500 280" stroke="#7c3aed" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.6"/>
                <path d="M 285 295 Q 400 260 500 280" stroke="#a855f7" strokeWidth="2" fill="none" strokeDasharray="5,5" opacity="0.6"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-title">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage your vehicle fleet efficiently and effectively</p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: '🚗',
                title: 'Real-Time Tracking',
                desc: 'Monitor your entire fleet in real-time with GPS tracking, live status updates, and instant notifications for better control and security.'
              },
              {
                icon: '🤖',
                title: 'AI-Powered Scheduling',
                desc: 'Optimize driver schedules and vehicle assignments using advanced AI algorithms that consider efficiency, availability, and operational requirements.'
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                desc: 'Get comprehensive insights with detailed reports, performance metrics, and data visualization to make informed business decisions.'
              },
              {
                icon: '🔐',
                title: 'Role-Based Access',
                desc: 'Secure multi-level access control for administrators, managers, guards, and drivers with customized permissions and features.'
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                desc: 'Access your VMS from anywhere with our responsive design that works perfectly on desktop, tablet, and mobile devices.'
              },
              {
                icon: '⚡',
                title: 'Real-Time Logs',
                desc: 'Live vehicle entry/exit logs with WebSocket technology for instant updates and real-time monitoring of gate activities.'
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card fade-in">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-title">
            <h2>What We Provide</h2>
            <p>Comprehensive vehicle management solutions tailored to your business needs</p>
          </div>

          <div className="services-grid">
            {[
              {
                icon: '🎯',
                title: 'Fleet Management',
                desc: 'Complete oversight of your vehicle fleet with tracking, maintenance scheduling, and performance optimization.'
              },
              {
                icon: '👥',
                title: 'User Management',
                desc: 'Comprehensive user role management with secure authentication and permission-based access control.'
              },
              {
                icon: '📈',
                title: 'Performance Analytics',
                desc: 'Advanced reporting and analytics to track KPIs, fuel efficiency, and operational performance metrics.'
              },
              {
                icon: '🔧',
                title: 'VIN Decoding',
                desc: 'Automatic vehicle information extraction using VIN numbers with integration to NHTSA database.'
              },
              {
                icon: '📋',
                title: 'Smart Scheduling',
                desc: 'AI-powered driver and vehicle scheduling optimization for maximum efficiency and resource utilization.'
              },
              {
                icon: '🛡️',
                title: 'Security & Compliance',
                desc: 'Enterprise-grade security with audit trails, compliance reporting, and data protection measures.'
              }
            ].map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="user-roles">
        <div className="container">
          <div className="section-title">
            <h2>User Roles & Access</h2>
            <p>Different access levels designed for different responsibilities in your organization</p>
          </div>

          <div className="roles-grid">
            {[
              {
                avatar: '👨‍💼',
                title: 'Administrator',
                desc: 'Full system access with complete control over all operations and configurations.',
                features: [
                  'Manage all organizations',
                  'Create and manage users',
                  'System-wide vehicle oversight',
                  'Advanced analytics and reports',
                  'System configuration'
                ],
                role: 'ADMIN'
              },
              {
                avatar: '👨‍💻',
                title: 'Organization Manager',
                desc: 'Manage organization-specific operations including staff and vehicle assignments.',
                features: [
                  'Manage organization users',
                  'Vehicle pool management',
                  'AI schedule generation',
                  'Staff assignment',
                  'Organization analytics'
                ],
                role: 'ORG_MANAGER'
              },
              {
                avatar: '👮‍♂️',
                title: 'Security Guard',
                desc: 'Monitor and verify vehicle and driver activities at entry/exit points.',
                features: [
                  'Real-time vehicle logs',
                  'Driver schedule viewing',
                  'Vehicle verification',
                  'Entry/exit logging',
                  'Security monitoring'
                ],
                role: 'GUARD'
              },
              {
                avatar: '🚗',
                title: 'Driver',
                desc: 'View personal schedules and assigned vehicle information for daily operations.',
                features: [
                  'Personal schedule view',
                  'Assigned vehicle details',
                  'Shift information',
                  'Vehicle status',
                  'Basic dashboard'
                ],
                role: 'DRIVER'
              }
            ].map((roleData, index) => (
              <div key={index} className="role-card">
                <div className="role-avatar">{roleData.avatar}</div>
                <h3>{roleData.title}</h3>
                <p>{roleData.desc}</p>
                <ul className="role-features">
                  {roleData.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <button 
                  className="btn btn-primary"
                  onClick={() => selectRole(roleData.role)}
                >
                  Login as {roleData.title.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>🚗 VMS</h3>
              <p>Smart Vehicle Management Made Simple</p>
              <p>Streamline your fleet operations with our comprehensive Vehicle Management System featuring real-time tracking, AI-powered scheduling, and advanced analytics.</p>
            </div>

            <div className="footer-section">
              <h3>Quick Links</h3>
              <p><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></p>
              <p><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></p>
              <p><a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>User Roles</a></p>
            </div>

            <div className="footer-section">
              <h3>Features</h3>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Real-Time Tracking</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>AI Scheduling</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Analytics Dashboard</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>VIN Decoding</a></p>
            </div>

            <div className="footer-section">
              <h3>Contact Info</h3>
              <p>📧 info@vms-system.com</p>
              <p>📞 +1 (555) 123-4567</p>
              <p>📍 123 Tech Street, Innovation City</p>
              <p>🕒 24/7 Support Available</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 VMS - Vehicle Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Login to VMS</h2>
            
            {loginError && (
              <div className="error-message">{loginError}</div>
            )}
            
            <div className="form-group">
              <label>Role:</label>
              <select 
                value={loginForm.role}
                onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
              >
                <option value="">Select Your Role</option>
                <option value="ADMIN">Administrator</option>
                <option value="ORG_MANAGER">Organization Manager</option>
                <option value="GUARD">Security Guard</option>
                <option value="DRIVER">Driver</option>
              </select>
            </div>

            <div className="form-group">
              <label>Username:</label>
              <input 
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input 
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter your password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>

            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={closeLoginModal}
                disabled={loginLoading}
              >
                Cancel
              </button>
            </div>

            <div className="demo-credentials">
              <h4>Demo Credentials:</h4>
              <p>
                Admin: admin_test / test123<br/>
                Manager: orgmgr_test / test123<br/>
                Guard: guard_test / test123<br/>
                Driver: driver_test / test123
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;