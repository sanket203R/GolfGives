import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Footer.css';

export default function Footer() {
  const { draws, charities } = useApp();
  const nextDraw = draws.find(d => d.status === 'upcoming');
  const totalRaised = charities.reduce((sum, c) => sum + (c.raised || 0), 0);
  const participants = charities.reduce((sum, c) => sum + (c.supporters || 0), 0);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">⛳ Golf<span>Gives</span></div>
            <p className="footer__tagline">Where every swing creates change. Play the game you love and help the causes that matter.</p>
            <div className="footer__social">
              {['𝕏', 'in', 'f', '▶'].map((s, i) => (
                <button key={i} className="footer__social-btn">{s}</button>
              ))}
            </div>
          </div>
          <div className="footer__col">
            <h4>Platform</h4>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/draws">Monthly Draws</Link>
            <Link to="/charities">Our Charities</Link>
            <Link to="/signup">Join Now</Link>
          </div>
          <div className="footer__col">
            <h4>Support</h4>
            <a href="#">FAQ</a>
            <a href="#">Contact Us</a>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="footer__col">
            <h4>Next Draw</h4>
            <div className="footer__draw-info">
              <div className="footer__draw-stat">
                <span>Prize Pool</span>
                <strong>£{(nextDraw?.prizePool || 0).toLocaleString()}</strong>
              </div>
              <div className="footer__draw-stat">
                <span>Draw Date</span>
                <strong>{nextDraw?.month || 'TBA'}</strong>
              </div>
              <div className="footer__draw-stat">
                <span>Participants</span>
                <strong>{participants.toLocaleString()}</strong>
              </div>
              <div className="footer__draw-stat">
                <span>Total Raised</span>
                <strong>£{totalRaised.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2025 GolfGives Ltd. All rights reserved. Registered in England & Wales.</p>
          <p>Licensed lottery operator. Please gamble responsibly. 18+</p>
        </div>
      </div>
    </footer>
  );
}
