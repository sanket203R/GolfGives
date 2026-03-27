import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api';
import { Plus, Trophy, Heart, Calendar, TrendingUp, AlertCircle, Upload } from 'lucide-react';
import './Dashboard.css';

function ScoreEntry({ onAdd }) {
  const [score, setScore] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(score);
    if (!val || val < 1 || val > 45) { setError('Score must be between 1 and 45'); return; }
    onAdd({ value: val, date });
    setScore('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="score-entry">
      {error && <div className="score-entry__error"><AlertCircle size={14} />{error}</div>}
      <div className="score-entry__inputs">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Score (1–45)</label>
          <input type="number" className="input-field" placeholder="e.g. 22" min="1" max="45"
            value={score} onChange={e => setScore(e.target.value)} required />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Date Played</label>
          <input type="date" className="input-field" value={date}
            onChange={e => setDate(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary score-entry__btn">
          <Plus size={16} /> Add Score
        </button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const { currentUser, charities, draws, addScore, updateCharityPreference, subscribe, isSubscriptionActive, requestVerification, setCurrentUserFromFetch, syncSubscription } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editCharity, setEditCharity] = useState(false);
  const [verificationProof, setVerificationProof] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationDragOver, setVerificationDragOver] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationPreview, setVerificationPreview] = useState(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setVerificationProof(file);
      const reader = new FileReader();
      reader.onload = (e) => setVerificationPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleVerificationDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVerificationDragOver(true);
  };

  const handleVerificationDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVerificationDragOver(false);
  };

  const handleVerificationDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVerificationDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveVerificationFile = () => {
    setVerificationProof(null);
    setVerificationPreview(null);
  };

  const handleSubmitVerification = async () => {
    if (!verificationProof) {
      alert('Please select an image');
      return;
    }
    if (!upcomingDraw) {
      alert('No active draw available. Please try again later.');
      return;
    }
    setVerificationLoading(true);
    try {
      const response = await requestVerification({
        drawId: upcomingDraw._id,
        proofFile: verificationProof
      });
      if (response.success) {
        setVerificationSuccess(true);
        setTimeout(() => {
          setVerificationSuccess(false);
          setShowVerification(false);
          setVerificationProof(null);
          setVerificationPreview(null);
        }, 2000);
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  // Poll for updated user data when returning from Stripe payment
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (paymentSuccess && currentUser && (currentUser.subscription === 'expired' || !currentUser.subscription)) {
      let pollCount = 0;
      const maxPolls = 120; // Poll up to 120 times = 4 minutes
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`🔄 Subscription poll #${pollCount}...`);
        
        try {
          // Always try checkSubscription first (checks with Stripe)
          const response = await api.checkSubscription();
          const user = response.user;
          
          console.log(`Poll ${pollCount}: subscription status = ${user.subscription}`);
          
          if (user.subscription === 'active') {
            console.log('✅ Subscription activated! Updating user and stopping polls.');
            setCurrentUserFromFetch(user);
            clearInterval(pollInterval);
            return;
          }
          
          if (pollCount >= maxPolls) {
            console.warn('⚠️ Polling timeout - subscription still not active after 2 minutes');
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.log(`Poll ${pollCount} error:`, err.message);
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 4 minutes
      const timeout = setTimeout(() => {
        console.log('⏱️ Polling timeout reached (4 minutes)');
        clearInterval(pollInterval);
      }, 240000);
      
      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [searchParams, currentUser, setCurrentUserFromFetch]);
  // FIX: charity is an ObjectId string (_id), not a Number
  const [tempCharity, setTempCharity] = useState(
    currentUser?.charity?._id || currentUser?.charity || ''
  );
  const [tempPercent, setTempPercent] = useState(currentUser?.charityPercent || 10);
  const [showVerification, setShowVerification] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }
  if (currentUser.role === 'admin') {
    navigate('/admin');
    return null;
  }

  // FIX: charity can be populated object or raw ObjectId string
  const charityId = currentUser.charity?._id || currentUser.charity;
  const selectedCharity = charities.find(c => c._id === charityId);
  const upcomingDraw = draws.find(d => d.status === 'upcoming');
  const isActive = currentUser.subscription === 'active';

  const handleSaveCharity = () => {
    updateCharityPreference(tempCharity, tempPercent);
    setEditCharity(false);
  };

  const handleManualCheckSubscription = async () => {
    try {
      console.log('🔄 Manual subscription check initiated...');
      const response = await api.checkSubscription();
      console.log('✅ Subscription check response:', response);
      if (response.user) {
        setCurrentUserFromFetch(response.user);
        if (response.user.subscription === 'active') {
          alert('✅ Subscription is now ACTIVE!');
        } else {
          alert(`⏳ Subscription status: ${response.user.subscription}. Please wait for webhook processing.`);
        }
      }
    } catch (err) {
      console.error('❌ Subscription check failed:', err);
      alert('Error checking subscription: ' + err.message);
    }
  };

  return (
    <div className="dashboard page-enter">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <div>
            <p className="section-label">Player Dashboard</p>
            <h1 className="dashboard__title">
              Hello, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p className="dashboard__subtitle">
              Member since {new Date(currentUser.joined).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="dashboard__status">
            <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
              {isActive ? '● Active' : '● Expired'}
            </span>
            <span className="badge badge-gold">{currentUser.plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}</span>
          </div>
        </div>

        {!isActive && (
          <div className="dashboard__alert">
            <AlertCircle size={18} />
            <div>
              <strong>Your subscription has expired.</strong>
              <p>Renew to participate in upcoming draws and enter scores.</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', whiteSpace: 'nowrap' }}>
              <button className="btn-secondary" style={{ padding: '10px 16px' }} onClick={handleManualCheckSubscription}>
                Check Status
              </button>
              <button className="btn-primary" onClick={() => subscribe(currentUser.plan || 'monthly')}>
                Renew Now
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="dashboard__stats">
          {[
            { icon: <Trophy size={20} />, label: 'Total Winnings', value: `£${currentUser.winnings.toLocaleString()}`, color: 'gold' },
            { icon: <Calendar size={20} />, label: 'Scores Entered', value: `${currentUser.scores.length}/5`, color: 'green' },
            { icon: <Heart size={20} />, label: 'Charity Donated', value: `£${Math.round(currentUser.winnings * currentUser.charityPercent / 100).toLocaleString()}`, color: 'pink' },
            { icon: <TrendingUp size={20} />, label: 'Next Draw Pool', value: `£${(upcomingDraw?.prizePool || 0).toLocaleString()}`, color: 'blue' },
          ].map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-card__icon stat-card__icon--${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="stat-card__value">{stat.value}</p>
                <p className="stat-card__label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="dashboard__grid">
          {/* Scores */}
          <div className="card dashboard__section">
            <div className="dashboard__section-header">
              <h2>My Scores</h2>
              <span className="badge badge-gray">{currentUser.scores.length}/5 this month</span>
            </div>
            <p className="dashboard__section-desc">
              Your last 5 scores are your draw numbers. Enter scores between 1–45. New scores replace the oldest.
            </p>

            {isActive && <ScoreEntry onAdd={addScore} />}

            <div className="scores-list">
              {currentUser.scores.length === 0 ? (
                <div className="scores-empty">
                  <span style={{ fontSize: '2rem' }}>⛳</span>
                  <p>No scores yet. Enter your first round!</p>
                </div>
              ) : (
                currentUser.scores.map((s, i) => (
                  <div className="score-item" key={i}>
                    <div className="score-item__ball">{s.value}</div>
                    <div>
                      <p className="score-item__date">{new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="score-item__label">{i === 0 ? 'Most Recent' : `Score #${i + 1}`}</p>
                    </div>
                    {i === 0 && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Latest</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard__right">
            {/* Charity */}
            <div className="card dashboard__section">
              <div className="dashboard__section-header">
                <h2>My Charity</h2>
                <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={() => setEditCharity(!editCharity)}>
                  {editCharity ? 'Cancel' : 'Change'}
                </button>
              </div>

              {editCharity ? (
                <div className="charity-edit">
                  <div className="form-group">
                    <label>Select Charity</label>
                    {/* FIX: use c._id (string), not Number(c.id) */}
                    <select className="input-field" value={tempCharity}
                      onChange={e => setTempCharity(e.target.value)}>
                      {charities.map(c => (
                        <option key={c._id} value={c._id}>{c.image} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Donation % ({tempPercent}%)</label>
                    <input type="range" min="10" max="50" step="5" className="range-input" style={{ width: '100%' }}
                      value={tempPercent} onChange={e => setTempPercent(Number(e.target.value))} />
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleSaveCharity}>Save Changes</button>
                </div>
              ) : selectedCharity ? (
                <div className="charity-display">
                  <div className="charity-display__icon">{selectedCharity.image}</div>
                  <div>
                    <h3>{selectedCharity.name}</h3>
                    <p className="charity-display__cat">{selectedCharity.category}</p>
                  </div>
                  <div className="charity-display__percent">
                    <strong>{currentUser.charityPercent}%</strong>
                    <span>of wins</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No charity selected yet.</p>
              )}
            </div>

            {/* Draw Summary */}
            <div className="card dashboard__section">
              <h2>Draw Participation</h2>
              <div className="draw-summary">
                <div className="draw-summary__scores">
                  <p className="draw-summary__label">Your Numbers This Month</p>
                  <div className="draw-summary__balls">
                    {currentUser.scores.length > 0
                      ? currentUser.scores.map((s, i) => (
                        <div className="draw-summary__ball" key={i}>{s.value}</div>
                      ))
                      : <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No scores entered yet</p>
                    }
                  </div>
                </div>
                <div className="draw-summary__info">
                  <div className="draw-info-item">
                    <span>Draw Date</span>
                    <strong>{upcomingDraw ? upcomingDraw.month : 'TBA'}</strong>
                  </div>
                  <div className="draw-info-item">
                    <span>Prize Pool</span>
                    <strong>£{(upcomingDraw?.prizePool || 0).toLocaleString()}</strong>
                  </div>
                  <div className="draw-info-item">
                    <span>Your Status</span>
                    <strong className={isActive ? 'text-green' : 'text-red'}>
                      {isActive && currentUser.scores.length > 0 ? 'Entered ✓' : 'Not Entered'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Winnings */}
            {currentUser.winnings > 0 && (
              <div className="card dashboard__section">
                <div className="dashboard__section-header">
                  <h2>🏆 My Winnings</h2>
                  <span className="badge badge-gold">£{currentUser.winnings.toLocaleString()}</span>
                </div>
                <div className="winning-item">
                  <div>
                    <p className="winning-item__label">December 2024 Draw — 4-match win</p>
                    <p className="winning-item__status">
                      <span className="badge badge-green">Paid</span>
                    </p>
                  </div>
                  <strong>£{currentUser.winnings.toLocaleString()}</strong>
                </div>
                {!showVerification ? (
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                    onClick={() => setShowVerification(true)}>
                    <Upload size={16} /> Upload Verification
                  </button>
                ) : (
                  <div className={`verification-upload ${verificationProof ? 'has-file' : ''} ${verificationLoading ? 'uploading' : ''} ${verificationSuccess ? 'success' : ''}`}
                    onDragOver={handleVerificationDragOver}
                    onDragLeave={handleVerificationDragLeave}
                    onDrop={handleVerificationDrop}>
                    <label className="verification-upload__label">Upload Screenshot Proof</label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      className="verification-upload__input"
                      id="verification-file-input"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    
                    {/* Upload Area */}
                    <div className="verification-upload__area"
                      onClick={() => document.getElementById('verification-file-input').click()}>
                      <div className="verification-upload__icon">📤</div>
                      <div className="verification-upload__text">Drag & drop your image here</div>
                      <p className="verification-upload__hint">or click to select payment proof screenshot</p>
                    </div>

                    {/* File Info */}
                    {verificationProof && (
                      <div className="verification-upload__file-info">
                        {verificationPreview && (
                          <div className="verification-upload__file-preview">
                            <img src={verificationPreview} alt="Preview" />
                          </div>
                        )}
                        <div className="verification-upload__file-details">
                          <div className="verification-upload__file-name">{verificationProof.name}</div>
                          <div className="verification-upload__file-size">{(verificationProof.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className="verification-upload__file-actions">
                          <button
                            type="button"
                            className="verification-upload__file-btn verification-upload__file-btn--change"
                            onClick={() => document.getElementById('verification-file-input').click()}>
                            Change
                          </button>
                          <button
                            type="button"
                            className="verification-upload__file-btn verification-upload__file-btn--remove"
                            onClick={handleRemoveVerificationFile}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="verification-upload__progress">
                      <div className="verification-upload__progress-bar">
                        <div className="verification-upload__progress-fill" style={{ width: '50%' }}></div>
                      </div>
                      <div className="verification-upload__progress-text">
                        <span>Uploading...</span>
                        <span>50%</span>
                      </div>
                    </div>

                    {/* Success Message */}
                    <div className="verification-upload__success">
                      <div className="verification-upload__success-msg">Proof submitted successfully!</div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={!verificationProof || verificationLoading}
                        onClick={handleSubmitVerification}>
                        {verificationLoading ? 'Submitting...' : 'Submit Proof'}
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ justifyContent: 'center' }}
                        onClick={() => {
                          setShowVerification(false);
                          setVerificationProof(null);
                          setVerificationPreview(null);
                          setVerificationSuccess(false);
                        }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
