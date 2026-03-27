import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // FIX: result must be awaited — login() is async
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  // FIX: admin demo was using wrong email (admin@golfgives.com vs seeded admin@example.com)
  const demoLogin = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>
      <div className="auth-container">
        <div className="auth-card">
          <Link to="/" className="auth-logo">⛳ Golf<span>Gives</span></Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          <div className="demo-logins">
            <p className="demo-logins__label">Try a demo account:</p>
            <div className="demo-logins__btns">
              <button className="demo-btn" onClick={() => demoLogin('sarah@example.com', 'password123')}>
                Player Account
              </button>
              <button className="demo-btn" onClick={() => demoLogin('admin@example.com', 'admin123')}>
                Admin Account
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
