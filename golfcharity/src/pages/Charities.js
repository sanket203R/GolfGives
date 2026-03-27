import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, Heart, TrendingUp } from 'lucide-react';
import './Charities.css';

const CATEGORIES = ['All', 'Environment', 'Youth', 'Veterans', 'Health', 'Hunger'];

export default function Charities() {
  const { charities, isAuthenticated, donateToCharity } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedCharityId, setSelectedCharityId] = useState(null);
  const [message, setMessage] = useState(null);
  const [category, setCategory] = useState('All');

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    return matchSearch && matchCat;
  });

  const featured = charities.filter(c => c.featured);
  const totalRaised = charities.reduce((s, c) => s + c.raised, 0);
  const totalSupporters = charities.reduce((s, c) => s + c.supporters, 0);

  const startDonation = (charityId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedCharityId(charityId);
    setDonationAmount('');
    setMessage(null);
  };

  const submitDonation = async () => {
    const amount = Number(donationAmount);
    if (!amount || amount < 1) {
      setMessage({ type: 'error', text: 'Enter an amount of £1 or more.' });
      return;
    }

    const result = await donateToCharity(selectedCharityId, amount);
    if (result.success) {
      setMessage({ type: 'success', text: `Thanks for donating £${amount}!` });
      setSelectedCharityId(null);
      setDonationAmount('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Donation failed' });
    }
  };

  return (
    <div className="charities-page page-enter">
      <div className="charities-page__hero">
        <div className="charities-page__hero-bg" />
        <div className="container">
          <p className="section-label">Our Charities</p>
          <h1 className="charities-page__title">Play for a <em>Purpose</em></h1>
          <p className="charities-page__subtitle">
            Every subscription, every score, every win — a portion goes to the charity you choose.
            Together, we're building something bigger than golf.
          </p>
          <div className="charities-page__hero-stats">
            <div>
              <strong>£{totalRaised.toLocaleString()}</strong>
              <span>Total Raised</span>
            </div>
            <div>
              <strong>{totalSupporters.toLocaleString()}</strong>
              <span>Supporters</span>
            </div>
            <div>
              <strong>{charities.length}</strong>
              <span>Charity Partners</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Featured */}
        <div className="featured-charities">
          <p className="section-label">Featured This Month</p>
          <div className="featured-grid">
            {featured.slice(0, 2).map(c => (
              <div className="featured-card" key={c.id} style={{ borderColor: `${c.color}44` }}>
                <div className="featured-card__header" style={{ background: `linear-gradient(135deg, ${c.color}22, transparent)` }}>
                  <span className="featured-card__icon">{c.image}</span>
                  <div>
                    <span className="badge badge-gold">Featured</span>
                    <h3>{c.name}</h3>
                    <span className="badge badge-gray" style={{ marginTop: '4px' }}>{c.category}</span>
                  </div>
                </div>
                <p>{c.description}</p>
                <div className="featured-card__progress">
                  <div className="charity-card__progress-bar">
                    <div className="charity-card__progress-fill" style={{ width: `${(c.raised / c.goal) * 100}%`, background: c.color }} />
                  </div>
                  <div className="featured-card__progress-stats">
                    <span>£{c.raised.toLocaleString()} raised of £{c.goal.toLocaleString()}</span>
                    <strong style={{ color: c.color }}>{Math.round((c.raised / c.goal) * 100)}%</strong>
                  </div>
                </div>
                <div className="featured-card__footer">
                  <span><Heart size={14} style={{ color: '#f472b6' }} /> {c.supporters.toLocaleString()} supporters</span>
                  <span><TrendingUp size={14} style={{ color: '#4ade80' }} /> Active campaign</span>
                </div>
                <button className="btn-secondary" onClick={() => startDonation(c._id)}>
                  Donate now
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedCharityId && (
          <div className="donation-panel card">
            <h3>Donate to selected charity</h3>
            <p>Enter an amount in GBP and continue to checkout.</p>
            <div className="donation-controls">
              <input
                type="number"
                min="1"
                step="1"
                className="input-field"
                value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                placeholder="Amount £"
              />
              <button className="btn-primary" onClick={submitDonation}>Donate</button>
              <button className="btn-secondary" onClick={() => setSelectedCharityId(null)} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
            {message && <p className={message.type === 'error' ? 'text-danger' : 'text-success'}>{message.text}</p>}
          </div>
        )}

        {/* All Charities */}
        <div className="charities-browser">
          <div className="charities-browser__filters">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field search-input"
                placeholder="Search charities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="category-filters">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${category === cat ? 'category-btn--active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="charities-empty">
              <span style={{ fontSize: '2.5rem' }}>🔍</span>
              <p>No charities found matching your search.</p>
            </div>
          ) : (
            <div className="all-charities-grid">
              {filtered.map(c => (
                <div className="all-charity-card" key={c.id}>
                  <div className="all-charity-card__top">
                    <div className="all-charity-card__icon" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                      {c.image}
                    </div>
                    <div className="all-charity-card__meta">
                      <span className="badge badge-gray">{c.category}</span>
                      {c.featured && <span className="badge badge-gold">Featured</span>}
                    </div>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div className="charity-card__progress" style={{ marginTop: 'auto' }}>
                    <div className="charity-card__progress-bar">
                      <div className="charity-card__progress-fill" style={{ width: `${(c.raised / c.goal) * 100}%`, background: c.color }} />
                    </div>
                    <div className="charity-card__progress-stats">
                      <span>£{c.raised.toLocaleString()}</span>
                      <span>{c.supporters} supporters</span>
                    </div>
                  </div>
                  <button className="btn-secondary" style={{ marginTop: '10px' }} onClick={() => startDonation(c._id)}>
                    Donate Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
