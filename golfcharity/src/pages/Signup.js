import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const { signup, subscribe, charities } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    plan: 'monthly',
    // FIX: use _id (MongoDB ObjectId string) not c.id
    charity: charities[0]?._id || '',
    charityPercent: 10
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return; }
    
    // Match backend password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, and special char (!@#$%^&*)');
      return;
    }
    setStep(2);
  };

  // FIX: await was missing — signup() is async, result was a Promise
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        plan: form.plan,
        charity: form.charity || undefined,
        charityPercent: form.charityPercent
      });
      
      if (result.success) {
        // Account created successfully — now redirect to Stripe checkout
        // Update loading message
        setError('');
        // Call subscribe which will redirect to Stripe
        await subscribe(form.plan);
        // If subscribe throws an error, it will be caught below
      } else {
        setError(result.error || 'Signup failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup/subscribe error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
      </div>
      <div className="auth-container">
        <div className="auth-card auth-card--wide">
          <Link to="/" className="auth-logo">⛳ Golf<span>Gives</span></Link>

          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? 'auth-step--active' : ''}`}>
              <div className="auth-step__dot">{step > 1 ? <Check size={12} /> : '1'}</div>
              <span>Account</span>
            </div>
            <div className="auth-step__line" />
            <div className={`auth-step ${step >= 2 ? 'auth-step--active' : ''}`}>
              <div className="auth-step__dot">2</div>
              <span>Preferences</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="auth-title">Create Your Account</h1>
              <p className="auth-subtitle">Join 1,840+ golfers making a difference</p>
              <form onSubmit={handleNext} className="auth-form">
                {error && <div className="auth-error"><AlertCircle size={16} />{error}</div>}
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="input-field" placeholder="John Smith" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="input-field" placeholder="your@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} className="input-field"
                      placeholder="Min. 8 chars: uppercase, lowercase, number, symbol" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} required />
                    <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn-primary auth-submit">Continue →</button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">Choose Your Plan</h1>
              <p className="auth-subtitle">And select a charity to support</p>
              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="auth-error"><AlertCircle size={16} />{error}</div>}

                <div className="plan-selector">
                  {[
                    { id: 'monthly', label: 'Monthly', price: '£9.99/mo', sub: 'Flexible, cancel anytime' },
                    { id: 'yearly',  label: 'Yearly',  price: '£99/yr',   sub: 'Save £20.88 per year', badge: 'Best Value' },
                  ].map(p => (
                    <div
                      key={p.id}
                      className={`plan-option ${form.plan === p.id ? 'plan-option--selected' : ''}`}
                      onClick={() => setForm({ ...form, plan: p.id })}
                    >
                      {p.badge && <div className="plan-option__badge">{p.badge}</div>}
                      <strong>{p.label}</strong>
                      <span className="plan-option__price">{p.price}</span>
                      <span className="plan-option__sub">{p.sub}</span>
                      <div className={`plan-option__check ${form.plan === p.id ? 'plan-option__check--active' : ''}`}>
                        <Check size={12} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Choose Your Charity</label>
                  {/* FIX: use c._id (MongoDB ObjectId) not c.id, and keep it as string */}
                  <select className="input-field" value={form.charity}
                    onChange={e => setForm({ ...form, charity: e.target.value })}>
                    {charities.map(c => (
                      <option key={c._id} value={c._id}>{c.image} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Donation % from winnings (min 10%) — currently {form.charityPercent}%</label>
                  <div className="percent-slider">
                    <input type="range" min="10" max="50" step="5"
                      value={form.charityPercent}
                      onChange={e => setForm({ ...form, charityPercent: Number(e.target.value) })}
                      className="range-input"
                    />
                    <span className="percent-value">{form.charityPercent}%</span>
                  </div>
                </div>

                <div className="auth-form__actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
