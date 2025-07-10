// frontend/src/components/Homepage.js - ENHANCED VERSION WITH FLEET FOCUS
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
        onShowLogin(); // This will now trigger handleLogin in App.js
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
      if (header) { // Check if header exists
        if (window.scrollY > 100) {
          header.style.background = 'rgba(255, 255, 255, 0.98)';
          header.style.boxShadow = '0 2px 30px rgba(124, 58, 237, 0.15)';
        } else {
          header.style.background = 'rgba(255, 255, 255, 0.95)';
          header.style.boxShadow = '0 2px 20px rgba(124, 58, 237, 0.1)';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating elements animation
  useEffect(() => {
    const createFloatingElement = () => {
      const element = document.createElement('div');
      element.innerHTML = ['🚗', '🚛', '🚐', '🏢', '📊', '🔐', '📱', '⚡', '🛣️', '⛽'][Math.floor(Math.random() * 10)];
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
          <div className="logo">🚗 VMS Fleet</div>
          <ul className="nav-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <li><a href="#fleet" onClick={(e) => { e.preventDefault(); scrollToSection('fleet'); }}>Our Fleet</a></li>
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>Partners</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            <li>
              <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                Partner Login
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Premium Fleet Solutions<br/>for Growing Businesses</h1>
            <p>Access our extensive fleet of vehicles through our smart management platform. Partner companies can register, manage their teams, and seamlessly access vehicles from our premium fleet with advanced tracking, AI-powered scheduling, and real-time management.</p>
            
            <div className="cta-buttons">
              <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
                Partner Login
              </button>
              <button className="btn btn-secondary" onClick={() => scrollToSection('fleet')}>
                Explore Our Fleet
              </button>
            </div>

            <div className="hero-image">
              <svg width="1200" height="600" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="1200" height="600" fill="url(#gradient1)"/>
                
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
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#3b82f6',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#1d4ed8',stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#10b981',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#047857',stopOpacity:1}} />
                  </linearGradient>
                </defs>
                
                {/* VMS Main Building */}
                <rect x="450" y="80" width="300" height="350" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="3"/>
                <rect x="470" y="100" width="260" height="30" fill="url(#gradient2)"/>
                <text x="600" y="120" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">VMS FLEET HQ</text>
                
                {/* Windows */}
                <rect x="480" y="150" width="20" height="20" fill="#7c3aed"/>
                <rect x="520" y="150" width="20" height="20" fill="#7c3aed"/>
                <rect x="560" y="150" width="20" height="20" fill="#7c3aed"/>
                <rect x="600" y="150" width="20" height="20" fill="#7c3aed"/>
                <rect x="640" y="150" width="20" height="20" fill="#7c3aed"/>
                <rect x="680" y="150" width="20" height="20" fill="#7c3aed"/>
                
                <rect x="480" y="200" width="20" height="20" fill="#3b82f6"/>
                <rect x="520" y="200" width="20" height="20" fill="#3b82f6"/>
                <rect x="560" y="200" width="20" height="20" fill="#3b82f6"/>
                <rect x="600" y="200" width="20" height="20" fill="#3b82f6"/>
                <rect x="640" y="200" width="20" height="20" fill="#3b82f6"/>
                <rect x="680" y="200" width="20" height="20" fill="#3b82f6"/>

                {/* Partner Company Buildings */}
                {/* Company A */}
                <rect x="50" y="200" width="150" height="200" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="60" y="210" width="130" height="20" fill="url(#gradient3)"/>
                <text x="125" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">PARTNER COMPANY A</text>
                
                {/* Company B */}
                <rect x="250" y="180" width="120" height="220" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="260" y="190" width="100" height="20" fill="url(#gradient4)"/>
                <text x="310" y="205" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PARTNER CO B</text>
                
                {/* Company C */}
                <rect x="850" y="190" width="140" height="210" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="860" y="200" width="120" height="20" fill="url(#gradient2)"/>
                <text x="920" y="215" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PARTNER CO C</text>
                
                {/* Company D */}
                <rect x="1020" y="170" width="130" height="230" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="1030" y="180" width="110" height="20" fill="url(#gradient4)"/>
                <text x="1085" y="195" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PARTNER CO D</text>

                {/* VMS Fleet Vehicles */}
                {/* Sedans */}
                <rect x="120" y="450" width="60" height="25" rx="5" fill="url(#gradient2)"/>
                <circle cx="135" cy="480" r="8" fill="#374151"/>
                <circle cx="165" cy="480" r="8" fill="#374151"/>
                <text x="150" y="465" textAnchor="middle" fill="white" fontSize="8">SEDAN</text>

                <rect x="220" y="445" width="60" height="25" rx="5" fill="url(#gradient3)"/>
                <circle cx="235" cy="475" r="8" fill="#374151"/>
                <circle cx="265" cy="475" r="8" fill="#374151"/>
                <text x="250" y="460" textAnchor="middle" fill="white" fontSize="8">SEDAN</text>

                {/* SUVs */}
                <rect x="320" y="440" width="80" height="35" rx="5" fill="url(#gradient4)"/>
                <circle cx="340" cy="485" r="10" fill="#374151"/>
                <circle cx="380" cy="485" r="10" fill="#374151"/>
                <text x="360" y="460" textAnchor="middle" fill="white" fontSize="8">SUV</text>

                <rect x="430" y="445" width="80" height="35" rx="5" fill="#dc2626"/>
                <circle cx="450" cy="490" r="10" fill="#374151"/>
                <circle cx="490" cy="490" r="10" fill="#374151"/>
                <text x="470" y="465" textAnchor="middle" fill="white" fontSize="8">SUV</text>

                {/* Trucks */}
                <rect x="540" y="435" width="100" height="40" rx="5" fill="#f59e0b"/>
                <circle cx="565" cy="485" r="10" fill="#374151"/>
                <circle cx="605" cy="485" r="10" fill="#374151"/>
                <text x="590" y="458" textAnchor="middle" fill="white" fontSize="8">TRUCK</text>

                <rect x="670" y="440" width="100" height="40" rx="5" fill="#8b5cf6"/>
                <circle cx="695" cy="490" r="10" fill="#374151"/>
                <circle cx="735" cy="490" r="10" fill="#374151"/>
                <text x="720" y="463" textAnchor="middle" fill="white" fontSize="8">TRUCK</text>

                {/* Vans */}
                <rect x="800" y="445" width="90" height="35" rx="5" fill="url(#gradient2)"/>
                <circle cx="820" cy="485" r="9" fill="#374151"/>
                <circle cx="870" cy="485" r="9" fill="#374151"/>
                <text x="845" y="465" textAnchor="middle" fill="white" fontSize="8">VAN</text>

                <rect x="920" y="450" width="90" height="35" rx="5" fill="url(#gradient3)"/>
                <circle cx="940" cy="490" r="9" fill="#374151"/>
                <circle cx="990" cy="490" r="9" fill="#374151"/>
                <text x="965" y="470" textAnchor="middle" fill="white" fontSize="8">VAN</text>

                {/* GPS Tracking Icons */}
                <circle cx="150" cy="420" r="15" fill="#ef4444" opacity="0.8"/>
                <text x="150" y="427" textAnchor="middle" fill="white" fontSize="10">📍</text>
                
                <circle cx="360" cy="410" r="15" fill="#ef4444" opacity="0.8"/>
                <text x="360" y="417" textAnchor="middle" fill="white" fontSize="10">📍</text>
                
                <circle cx="590" cy="405" r="15" fill="#ef4444" opacity="0.8"/>
                <text x="590" y="412" textAnchor="middle" fill="white" fontSize="10">📍</text>

                <circle cx="845" cy="415" r="15" fill="#ef4444" opacity="0.8"/>
                <text x="845" y="422" textAnchor="middle" fill="white" fontSize="10">📍</text>

                {/* Central Control Dashboard */}
                <rect x="500" y="300" width="200" height="120" rx="10" fill="white" stroke="#d1d5db" strokeWidth="2"/>
                <rect x="510" y="310" width="180" height="20" fill="url(#gradient2)"/>
                <text x="600" y="325" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">FLEET CONTROL CENTER</text>
                
                {/* Dashboard Elements */}
                <rect x="520" y="340" width="160" height="3" fill="#10b981"/>
                <rect x="520" y="350" width="120" height="3" fill="#3b82f6"/>
                <rect x="520" y="360" width="140" height="3" fill="#f59e0b"/>
                <rect x="520" y="370" width="100" height="3" fill="#ef4444"/>
                
                <text x="520" y="390" fill="#374151" fontSize="8">Real-time Fleet Monitoring</text>
                <text x="520" y="405" fill="#374151" fontSize="8">AI-Powered Scheduling</text>

                {/* Connection Lines from Companies to VMS */}
                <path d="M 200 300 Q 300 250 450 320" stroke="#7c3aed" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity="0.7"/>
                <path d="M 370 290 Q 410 270 450 320" stroke="#3b82f6" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity="0.7"/>
                <path d="M 850 300 Q 750 250 700 320" stroke="#10b981" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity="0.7"/>
                <path d="M 1020 290 Q 900 250 700 320" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity="0.7"/>

                {/* Vehicle Assignment Lines */}
                <path d="M 450 360 Q 300 400 150 450" stroke="#7c3aed" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.6"/>
                <path d="M 500 360 Q 450 400 360 440" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.6"/>
                <path d="M 600 360 Q 650 400 720 440" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.6"/>
                <path d="M 700 360 Q 800 400 965 450" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.6"/>

                {/* Fleet Status Indicators */}
                <circle cx="100" cy="520" r="8" fill="#10b981"/>
                <text x="120" y="525" fontSize="10" fill="#374151">Available: 24 vehicles</text>
                
                <circle cx="300" cy="520" r="8" fill="#f59e0b"/>
                <text x="320" y="525" fontSize="10" fill="#374151">In Use: 18 vehicles</text>
                
                <circle cx="500" cy="520" r="8" fill="#3b82f6"/>
                <text x="520" y="525" fontSize="10" fill="#374151">Maintenance: 3 vehicles</text>
                
                <circle cx="720" cy="520" r="8" fill="#ef4444"/>
                <text x="740" y="525" fontSize="10" fill="#374151">Reserved: 12 vehicles</text>

                {/* VMS Logo on building */}
                <circle cx="600" cy="250" r="25" fill="white" stroke="#7c3aed" strokeWidth="3"/>
                <text x="600" y="257" textAnchor="middle" fill="#7c3aed" fontSize="16" fontWeight="bold">VMS</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Showcase Section */}
      <section id="fleet" className="fleet-showcase">
        <div className="container">
          <h2>Our Premium Fleet</h2>
          <p style={{ fontSize: '1.3rem', marginBottom: '3rem' }}>
            Over 500 vehicles ready for your business needs - from executive sedans to cargo trucks
          </p>
          
          <div className="fleet-stats">
            <div className="fleet-stat">
              <h3>500+</h3>
              <p>Total Vehicles</p>
            </div>
            <div className="fleet-stat">
              <h3>50+</h3>
              <p>Partner Companies</p>
            </div>
            <div className="fleet-stat">
              <h3>24/7</h3>
              <p>Fleet Monitoring</p>
            </div>
            <div className="fleet-stat">
              <h3>99.8%</h3>
              <p>Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-title">
            <h2>Complete Fleet Management</h2>
            <p>Everything your partner company needs to efficiently manage vehicle access and operations</p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: '🚗',
                title: 'Premium Fleet Access',
                desc: 'Access our diverse fleet of sedans, SUVs, trucks, and vans. All vehicles are maintained to the highest standards with regular servicing and safety checks.'
              },
              {
                icon: '🤖',
                title: 'AI-Powered Scheduling',
                desc: 'Our advanced AI optimizes vehicle assignments based on availability, location, driver schedules, and operational requirements for maximum efficiency.'
              },
              {
                icon: '📊',
                title: 'Real-Time Analytics',
                desc: 'Comprehensive dashboards provide insights into fleet utilization, driver performance, fuel consumption, and operational costs to optimize your business.'
              },
              {
                icon: '🔐',
                title: 'Multi-Level Access Control',
                desc: 'Secure role-based access for organization managers, security guards, and drivers with customized permissions and audit trails.'
              },
              {
                icon: '📱',
                title: 'Mobile & Desktop Ready',
                desc: 'Fully responsive platform works seamlessly across all devices - manage your fleet operations from anywhere, anytime.'
              },
              {
                icon: '⚡',
                title: 'Live Vehicle Tracking',
                desc: 'Real-time GPS tracking with instant notifications for vehicle entry/exit, route monitoring, and emergency assistance capabilities.'
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
            <h2>Comprehensive Fleet Services</h2>
            <p>End-to-end vehicle management solutions designed for modern businesses</p>
          </div>

          <div className="services-grid">
            {[
              {
                icon: '🎯',
                title: 'Fleet Registration & Onboarding',
                desc: 'Seamless partner company registration with dedicated fleet allocation and custom organizational setup.'
              },
              {
                icon: '👥',
                title: 'Team Management',
                desc: 'Complete user management system for organization managers, security personnel, and drivers with role-based permissions.'
              },
              {
                icon: '📈',
                title: 'Performance Analytics',
                desc: 'Advanced reporting on fleet utilization, cost optimization, driver efficiency, and operational insights.'
              },
              {
                icon: '🔧',
                title: 'VIN Decoding & Vehicle Info',
                desc: 'Automatic vehicle information extraction and maintenance history tracking using comprehensive VIN databases.'
              },
              {
                icon: '📋',
                title: 'Smart Scheduling & Assignment',
                desc: 'AI-driven optimization for vehicle assignments, driver scheduling, and route planning to maximize resource utilization.'
              },
              {
                icon: '🛡️',
                title: 'Security & Compliance',
                desc: 'Enterprise-grade security with facial recognition, license plate scanning, and comprehensive audit trails.'
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

      {/* Partner Roles Section */}
      <section id="roles" className="user-roles">
        <div className="container">
          <div className="section-title">
            <h2>Partner Company Structure</h2>
            <p>Designed for different roles within your organization - from management to operations</p>
          </div>

          <div className="roles-grid">
            {[
              {
                avatar: '👨‍💼',
                title: 'VMS Administrator',
                desc: 'Complete system oversight with full access to fleet management, partner onboarding, and system configuration.',
                features: [
                  'Manage all partner companies',
                  'Fleet allocation & monitoring',
                  'System-wide analytics',
                  'User management across partners',
                  'Platform configuration'
                ],
                role: 'ADMIN'
              },
              {
                avatar: '👨‍💻',
                title: 'Organization Manager',
                desc: 'Partner company managers who oversee their team operations, vehicle assignments, and scheduling.',
                features: [
                  'Manage company staff',
                  'Vehicle assignment & scheduling',
                  'Team performance monitoring',
                  'AI schedule optimization',
                  'Company analytics dashboard'
                ],
                role: 'ORG_MANAGER'
              },
              {
                avatar: '👮‍♂️',
                title: 'Security Guard',
                desc: 'Security personnel who verify driver identity, vehicle condition, and manage entry/exit procedures.',
                features: [
                  'Driver verification & check-in',
                  'Vehicle condition logging',
                  'Real-time security monitoring',
                  'Facial recognition systems',
                  'Access control management'
                ],
                role: 'GUARD'
              },
              {
                avatar: '🚗',
                title: 'Company Driver',
                desc: 'Drivers from partner companies who access assigned vehicles and view their schedules and assignments.',
                features: [
                  'View assigned vehicles',
                  'Check daily schedules',
                  'Vehicle status updates',
                  'Route information',
                  'Performance tracking'
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
                  Login as {roleData.title.split(' ')[roleData.title.split(' ').length - 1]}
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
              <h3>🚗 VMS Fleet Solutions</h3>
              <p>Premium Fleet Management for Modern Businesses</p>
              <p>We provide comprehensive vehicle management solutions for partner companies, featuring real-time tracking, AI-powered scheduling, and advanced fleet analytics. Join our network of successful business partners.</p>
            </div>

            <div className="footer-section">
              <h3>Fleet Services</h3>
              <p><a href="#fleet" onClick={(e) => { e.preventDefault(); scrollToSection('fleet'); }}>Vehicle Fleet</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Fleet Management</a></p>
              <p><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Partner Services</a></p>
              <p><a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>Team Roles</a></p>
            </div>

            <div className="footer-section">
              <h3>Partner Solutions</h3>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Real-Time Tracking</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>AI Scheduling</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Analytics Dashboard</a></p>
              <p><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Security Systems</a></p>
            </div>

            <div className="footer-section">
              <h3>Contact VMS Fleet</h3>
              <p>📧 partners@vms-fleet.com</p>
              <p>📞 +1 (555) VMS-FLEET</p>
              <p>📍 Fleet Operations Center<br/>123 Business Park Drive</p>
              <p>🕒 24/7 Fleet Support Available</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 VMS Fleet Solutions. All rights reserved. | Empowering businesses through smart fleet management.</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={closeLoginModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Partner Login</h2>
            
            {loginError && (
              <div className="error-message">{loginError}</div>
            )}
            
            <div className="form-group">
              <label>Your Role:</label>
              <select 
                value={loginForm.role}
                onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
              >
                <option value="">Select Your Role</option>
                <option value="ADMIN">VMS Administrator</option>
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
                {loginLoading ? 'Signing in...' : 'Sign In'}
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
              <h4>Demo Partner Credentials:</h4>
              <p>
                VMS Admin: admin_test / test123<br/>
                Org Manager: orgmgr_test / test123<br/>
                Security Guard: guard_test / test123<br/>
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