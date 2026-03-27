import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlertCircle, Check, ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function Subscribe() {
  const { subscribe, currentUser } = useApp();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // Redirect if already subscribed
  if (currentUser.subscription === 'active') {
    navigate('/dashboard');
    return null;
  }

  const handleSubscribe = async (plan) => {
    setError('');
    setLoading(true);
    try {
      await subscribe(plan);
      // subscribe() redirects to Stripe, so this code shouldn't execute
      // but keep as safety fallback
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription. Please try again.');
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

          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="auth-title">Choose Your Plan</h1>
          <p className="auth-subtitle">
            Start playing with {currentUser.name.split(' ')[0]} 👋
          </p>

          <div style={{ marginTop: '32px' }}>
            {error && (
              <div className="auth-error" style={{ marginBottom: '20px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="plan-selector">
              {[
                {
                  id: 'monthly',
                  label: 'Monthly',
                  price: '£9.99',
                  period: '/month',
                  sub: 'Flexible, cancel anytime',
                  features: ['Enter up to 5 scores/month', 'Participate in monthly draw', 'Choose your charity', 'Manage donation %']
                },
                {
                  id: 'yearly',
                  label: 'Yearly',
                  price: '£99',
                  period: '/year',
                  sub: 'Save £20.88 per year',
                  badge: 'Best Value',
                  features: ['All Monthly features', '12 draws included', 'Priority draw entry', 'Enhanced charity stats']
                },
              ].map(p => (
                <div
                  key={p.id}
                  className={`plan-option ${selectedPlan === p.id ? 'plan-option--selected' : ''}`}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{ cursor: 'pointer', marginBottom: '16px', padding: '20px' }}
                >
                  {p.badge && <div className="plan-option__badge">{p.badge}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>{p.label}</strong>
                      <div className="plan-option__price" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '8px' }}>
                        {p.price}<span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>{p.period}</span>
                      </div>
                      <span className="plan-option__sub" style={{ fontSize: '0.9rem', marginTop: '4px', display: 'block' }}>{p.sub}</span>
                    </div>
                    <div className={`plan-option__check ${selectedPlan === p.id ? 'plan-option__check--active' : ''}`}>
                      <Check size={20} />
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.95rem' }}>
                        <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading}
              className="btn-primary auth-submit"
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
