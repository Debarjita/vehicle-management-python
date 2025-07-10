// frontend/src/components/Login.js
import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/token/", {
        username, 
        password
      });
      
      const { access, role } = res.data;  // Extract both token and role
      
      // Store both token and role
      localStorage.setItem("accessToken", access);
      localStorage.setItem("userRole", role);
      
      console.log("Login successful, role:", role);
      onLogin(); // Trigger parent component update
      
    } catch (err) {
      console.error("Login error:", err.response?.data);
      setError("Login failed: " + (err.response?.data?.detail || "Invalid credentials"));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, border: '1px solid #ccc' }}>
      <form onSubmit={handleLogin}>
        <h2>VMS Login</h2>
        <div style={{ marginBottom: 15 }}>
          <input 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: 10 }}
            required
          />
        </div>
        <div style={{ marginBottom: 15 }}>
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10 }}
            required
          />
        </div>
        <button 
          type="submit" 
          style={{ width: '100%', padding: 10, backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          Login
        </button>
        {error && <div style={{color:"red", marginTop: 10}}>{error}</div>}
      </form>
    </div>
  );
}

export default Login;