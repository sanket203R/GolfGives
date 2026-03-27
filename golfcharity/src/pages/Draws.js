import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Trophy, Users, TrendingUp, ChevronDown, Upload } from 'lucide-react';
import './Draws.css';

export default function Draws() {
  const { draws, totalPrizePool, currentUser, requestVerification } = useApp();
  const [expanded, setExpanded] = useState(null);

  const upcomingDraw = draws.find(d => d.status === 'upcoming');
  const pastDraws = draws.filter(d => d.status === 'completed');
  const [verificationProof, setVerificationProof] = useState('');
  const [message, setMessage] = useState(null);

  const handleVerificationSubmit = async () => {
    if (!upcomingDraw) {
      setMessage({ type: 'error', text: 'No upcoming draw to verify against' });
      return;
    }
    if (!verificationProof) {
      setMessage({ type: 'error', text: 'Please provide a proof image URL or data URL' });
      return;
    }

    const response = await requestVerification({
      drawId: upcomingDraw._id,
      proofUrl: verificationProof,
      proofDataUrl: verificationProof.startsWith('data:') ? verificationProof : undefined
    });

    if (response.success) {
      setMessage({ type: 'success', text: 'Verification request submitted.' });
      setVerificationProof('');
    } else {
      setMessage({ type: 'error', text: response.error || 'Failed to submit verification' });
    }
  };


  return (
    <div className="draws-page page-enter">
      <div className="draws-page__hero">
        <div className="container">
          <p className="section-label">Monthly Draws</p>
          <h1 className="draws-page__title">The Draw <em>System</em></h1>
          <p className="draws-page__subtitle">
            Every month, five numbers are drawn. Match your golf scores to win.
            The more you match, the more you earn.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Upcoming Draw */}
        {upcomingDraw && (
          <div className="upcoming-draw">
            <div className="upcoming-draw__label">
              <span className="pulse-dot" />
              Next Draw — {upcomingDraw.month}
            </div>
            <div className="upcoming-draw__grid">
              <div className="upcoming-draw__left">
                <h2>{upcomingDraw.month} Draw</h2>
                <p>The draw takes place on the last day of each month. Make sure all your scores are entered before the deadline.</p>

                <div className="prize-tiers">
                  {[
                    { match: '5 Match', prize: `£${Math.floor(upcomingDraw.prizePool * 0.4).toLocaleString()}`, pct: '40%', icon: '🏆', note: 'Jackpot — rolls over if no winner', color: '#c9a84c' },
                    { match: '4 Match', prize: `£${Math.floor(upcomingDraw.prizePool * 0.35).toLocaleString()}`, pct: '35%', icon: '⭐', note: 'Split equally among winners', color: '#93c5fd' },
                    { match: '3 Match', prize: `£${Math.floor(upcomingDraw.prizePool * 0.25).toLocaleString()}`, pct: '25%', icon: '✅', note: 'Split equally among winners', color: '#4ade80' },
                  ].map((tier, i) => (
                    <div className="prize-tier-row" key={i}>
                      <div className="prize-tier-row__icon">{tier.icon}</div>
                      <div className="prize-tier-row__info">
                        <strong>{tier.match}</strong>
                        <span>{tier.note}</span>
                      </div>
                      <div className="prize-tier-row__value">
                        <strong style={{ color: tier.color }}>{tier.prize}</strong>
                        <span>{tier.pct} of pool</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="upcoming-draw__right">
                <div className="draw-countdown">
                  <p className="draw-countdown__label">Prize Pool</p>
                  <div className="draw-countdown__amount">
                    £{upcomingDraw.prizePool.toLocaleString()}
                  </div>
                  <div className="draw-countdown__stats">
                    <div>
                      <strong>1,840</strong>
                      <span>Participants</span>
                    </div>
                    <div>
                      <strong>Jan 31</strong>
                      <span>Draw Date</span>
                    </div>
                  </div>
                  <div className="jackpot-rollover" style={{ marginTop: '16px' }}>
                    🔄 Jackpot rolled over from Dec — £20,800!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="draw-card draw-participation-cta">
            <h2>Ready to Play?</h2>
            <p>Sign up to get your unique lottery numbers and participate in this month's draw.</p>
            <a href="/signup" className="btn-primary">Get Started</a>
          </div>
        )}

        {currentUser && currentUser.subscription !== 'active' && (
          <div className="draw-card draw-participation-locked">
            <h2>⭐ Upgrade Your Membership</h2>
            <p>You need an active subscription to participate in draws. Upgrade now to enter this month's draw and compete for prizes!</p>
            <a href="/signup" className="btn-primary">Upgrade Membership</a>
          </div>
        )}

        {currentUser && currentUser.subscription === 'active' && (
          <div className="draw-card draw-participation-active">
            <h2>✅ You're Entered!</h2>
            <p>Your golf scores for this month will automatically be entered into the draw when submitted on your dashboard. Make sure to add your scores before the draw deadline!</p>
            <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
          </div>
        )}

        

        {/* How Draw Works */}
        <div className="draw-explainer">
          <p className="section-label">Draw Mechanics</p>
          <h2 className="draw-explainer__title">How the Draw Works</h2>
          <div className="draw-explainer__grid">
            {[
              { icon: '📊', title: 'Score = Number', desc: 'Each golf score you enter (1–45) becomes one of your draw numbers. Enter up to 5 scores per month.' },
              { icon: '🎲', title: 'Random Draw', desc: 'On draw day, 5 numbers are randomly selected from 1–45. Our algorithm is independently verified.' },
              { icon: '🔢', title: 'Match to Win', desc: 'Compare your scores against drawn numbers. Match 3, 4, or all 5 to win your tier of the prize pool.' },
              { icon: '🔄', title: 'Jackpot Rollover', desc: 'If no one matches all 5, the 5-match jackpot rolls over to next month, growing each time.' },
            ].map((item, i) => (
              <div className="draw-explainer__card" key={i}>
                <div className="draw-explainer__icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Past Draws */}
        <div className="past-draws">
          <p className="section-label">Draw History</p>
          <h2 className="past-draws__title">Past Results</h2>

          {pastDraws.map(draw => (
            <div className="past-draw-card" key={draw.id}>
              <div className="past-draw-card__header" onClick={() => setExpanded(expanded === draw.id ? null : draw.id)}>
                <div className="past-draw-card__meta">
                  <Calendar size={16} />
                  <strong>{draw.month}</strong>
                  <span className="badge badge-gray">Completed</span>
                </div>
                <div className="past-draw-card__summary">
                  <span><Trophy size={14} /> £{draw.prizePool.toLocaleString()} pool</span>
                  <span><Users size={14} /> {draw.winners3 + draw.winners4 + draw.winners5} winners</span>
                </div>
                <ChevronDown size={18} className={`past-draw-card__chevron ${expanded === draw.id ? 'past-draw-card__chevron--open' : ''}`} />
              </div>

              {expanded === draw.id && draw.numbers && (
                <div className="past-draw-card__details">
                  <div className="past-draw-card__numbers">
                    <p className="past-draw-card__numbers-label">Winning Numbers</p>
                    <div className="lottery-balls" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                      {draw.numbers.map((n, i) => (
                        <div className="lottery-ball" key={i} style={{ width: '52px', height: '52px', fontSize: '1.2rem' }}>{n}</div>
                      ))}
                    </div>
                  </div>
                  <div className="past-draw-card__breakdown">
                    {[
                      { match: '5 Match', winners: draw.winners5, prize: `£${Math.floor(draw.prizePool * 0.4).toLocaleString()}`, color: '#c9a84c' },
                      { match: '4 Match', winners: draw.winners4, prize: `£${Math.floor(draw.prizePool * 0.35 / Math.max(draw.winners4, 1)).toLocaleString()} each`, color: '#93c5fd' },
                      { match: '3 Match', winners: draw.winners3, prize: `£${Math.floor(draw.prizePool * 0.25 / Math.max(draw.winners3, 1)).toLocaleString()} each`, color: '#4ade80' },
                    ].map((tier, i) => (
                      <div className="breakdown-row" key={i}>
                        <span style={{ color: tier.color, fontWeight: 600 }}>{tier.match}</span>
                        <span>{tier.winners} winner{tier.winners !== 1 ? 's' : ''}</span>
                        <span style={{ color: tier.color }}>{tier.prize}</span>
                      </div>
                    ))}
                  </div>
                  {draw.jackpot > 0 && (
                    <div className="past-draw-card__jackpot">
                      {draw.winners5 === 0
                        ? `🔄 No 5-match winner — £${draw.jackpot.toLocaleString()} jackpot rolled over`
                        : `🏆 Jackpot won! £${draw.jackpot.toLocaleString()} claimed`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
