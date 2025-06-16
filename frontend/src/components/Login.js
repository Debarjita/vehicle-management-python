import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/token/', {
        username,
        password
      });

      const { access, refresh } = res.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userRole', res.data.role);
      setMessage('✅ Login success!');
      onLogin && onLogin();
    } catch (err) {
      setMessage('❌ Login failed: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div>
      <h2>Login (JWT)</h2>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
    </div>
  );
}

export default Login;
