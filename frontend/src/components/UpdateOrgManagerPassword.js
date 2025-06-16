// frontend/src/components/OrgManagerRegister.js
import React, { useState } from 'react';
import axios from 'axios';

const OrgManagerRegister = () => {
  const [form, setForm] = useState({ username: '', password: '', confirm_password: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('accessToken');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/accounts/update-password/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.success || 'Registered!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Org Manager Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full border p-2" />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full border p-2" />
        <input type="password" name="confirm_password" placeholder="Confirm Password" value={form.confirm_password} onChange={handleChange} className="w-full border p-2" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
      </form>
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  );
};

export default OrgManagerRegister;
