import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Trophy, Heart, Users, TrendingUp, Star, Check, ChevronDown } from 'lucide-react';
import './Home.css';

function CountUp({ end, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 2000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Home() {
  const { charities, draws, totalPrizePool, isAuthenticated, currentUser } = useApp();
  const upcomingDraw = draws.find(d => d.status === 'upcoming');
  const pastDraws = draws.filter(d => d.status === 'completed');
  const lastDraw = pastDraws[0]; // Most recent completed draw
  const isSubscribed = currentUser?.subscription === 'active';
  const featuredCharities = charities.filter(c => c.featured).slice(0, 3);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__grid-lines" />
        </div>
        <div className="container hero__content">
          <div className="hero__badge">
            <span className="pulse-dot" />
            Next Draw: {upcomingDraw?.month || 'Coming Soon'}
          </div>
          <h1 className="hero__title">
            Play Golf.<br />
            <em>Win Big.</em><br />
            <span className="gradient-text">Change Lives.</span>
          </h1>
          <p className="hero__subtitle">
            Enter your golf scores each month for a chance to win life-changing prizes—
            while supporting the charities you care about most.
          </p>
          <div className="hero__cta">
            <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn-primary hero__btn-main">
              {isAuthenticated ? 'Go to Dashboard' : 'Start Playing'} <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="btn-secondary">
              How It Works
            </Link>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <strong><CountUp end={upcomingDraw?.prizePool || totalPrizePool || 0} prefix="£" /></strong>
              <span>Current Prize Pool</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong><CountUp end={charities.reduce((sum, c) => sum + (c.supporters || 0), 0)} /></strong>
              <span>Active Players</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong><CountUp end={charities.reduce((sum, c) => sum + (c.raised || 0), 0)} prefix="£" /></strong>
              <span>Donated to Charities</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong><CountUp end={charities.length} /></strong>
              <span>Partner Charities</span>
            </div>
          </div>
        </div>
        <div className="hero__scroll">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="container">
          <p className="section-label">Simple Process</p>
          <h2 className="section-title">How GolfGives Works</h2>
          <div className="steps-grid">
            {[
              { num: '01', icon: '📋', title: 'Subscribe', desc: 'Join for £9.99/month or £99/year. Your subscription funds the prize pool and charitable causes.' },
              { num: '02', icon: '⛳', title: 'Enter Scores', desc: 'Submit your last 5 golf scores (1–45) each month. Your scores are your lottery numbers.' },
              { num: '03', icon: '🎲', title: 'Monthly Draw', desc: 'Each month, 5 winning numbers are drawn. Match 3, 4, or all 5 to win your share of the prize pool.' },
              { num: '04', icon: '💝', title: 'Give Back', desc: 'A portion of every prize goes to your chosen charity. Win more, give more.' },
            ].map((step, i) => (
              <div className="step-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="step-card__num">{step.num}</div>
                <div className="step-card__icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool */}
      <section className="prize-section">
        <div className="container">
          <div className="prize-banner">
            <div className="prize-banner__left">
              <p className="section-label">{upcomingDraw?.month || 'Next Draw'}</p>
              <h2 className="prize-banner__amount">£{upcomingDraw?.prizePool?.toLocaleString() || '52,000'}</h2>
              <p className="prize-banner__sub">Total Prize Pool</p>
              <div className="prize-breakdown">
                <div className="prize-tier prize-tier--gold">
                  <Trophy size={20} />
                  <div>
                    <strong>5-Match Jackpot</strong>
                    <span>40% → £{upcomingDraw ? Math.floor(upcomingDraw.prizePool*0.4).toLocaleString() : '20,800'}</span>
                  </div>
                </div>
                <div className="prize-tier">
                  <Star size={20} />
                  <div>
                    <strong>4-Match Prize</strong>
                    <span>35% → £{upcomingDraw ? Math.floor(upcomingDraw.prizePool*0.35).toLocaleString() : '18,200'}</span>
                  </div>
                </div>
                <div className="prize-tier">
                  <Check size={20} />
                  <div>
                    <strong>3-Match Prize</strong>
                    <span>25% → £{upcomingDraw ? Math.floor(upcomingDraw.prizePool*0.25).toLocaleString() : '13,000'}</span>
                  </div>
                </div>
              </div>
              {!isAuthenticated && (
                <Link to="/signup" className="btn-primary" style={{ marginTop: '24px' }}>
                  Enter This Month's Draw <ArrowRight size={16} />
                </Link>
              )}
              {isAuthenticated && !isSubscribed && (
                <Link to="/subscribe" className="btn-primary" style={{ marginTop: '24px' }}>
                  Subscribe to Enter Draw <ArrowRight size={16} />
                </Link>
              )}
              {isAuthenticated && isSubscribed && (
                <Link to="/draws" className="btn-primary" style={{ marginTop: '24px' }}>
                  Enter This Month's Draw <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className="prize-banner__right">
              <div className="lottery-ball-display">
                <p className="lottery-ball-display__label">Last Draw Numbers</p>
                <div className="lottery-balls">
                  {lastDraw?.numbers && lastDraw.numbers.length > 0 ? (
                    lastDraw.numbers.map((n, i) => (
                      <div className="lottery-ball" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                        {n}
                      </div>
                    ))
                  ) : (
                    [12, 7, 34, 19, 41].map((n, i) => (
                      <div className="lottery-ball" key={i} style={{ animationDelay: `${i * 0.15}s`, opacity: 0.6 }}>
                        {n}
                      </div>
                    ))
                  )}
                </div>
                <p className="lottery-ball-display__date">{lastDraw?.month || 'December 2024'}</p>
                {upcomingDraw && upcomingDraw.jackpot > 0 && (
                  <div className="jackpot-rollover">
                    <span>🔄 Jackpot rolled over — £{upcomingDraw.jackpot.toLocaleString()} jackpot this month!</span>
                  </div>
                )}
                {(!upcomingDraw || upcomingDraw.jackpot <= 0) && (
                  <div className="jackpot-rollover">
                    <span>🔄 Jackpot rolled over — £20,800 jackpot this month!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charities */}
      <section className="charities-section">
        <div className="container">
          <div className="charities-header">
            <div>
              <p className="section-label">Making a Difference</p>
              <h2 className="section-title">Featured Charities</h2>
            </div>
            <Link to="/charities" className="btn-secondary">View All Charities</Link>
          </div>
          <div className="charities-grid">
            {featuredCharities.map(charity => (
              <div className="charity-card" key={charity.id}>
                <div className="charity-card__icon" style={{ background: `${charity.color}22`, border: `1px solid ${charity.color}44` }}>
                  <span>{charity.image}</span>
                </div>
                <div className="charity-card__badge badge badge-gold">{charity.category}</div>
                <h3>{charity.name}</h3>
                <p>{charity.description}</p>
                <div className="charity-card__progress">
                  <div className="charity-card__progress-bar">
                    <div
                      className="charity-card__progress-fill"
                      style={{
                        width: `${(charity.raised / charity.goal) * 100}%`,
                        background: charity.color
                      }}
                    />
                  </div>
                  <div className="charity-card__progress-stats">
                    <span>£{charity.raised.toLocaleString()} raised</span>
                    <span>{Math.round((charity.raised / charity.goal) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <p className="section-label">What Players Say</p>
          <h2 className="section-title">Real Stories, Real Impact</h2>
          <div className="testimonials-grid">
            {[
              { name: "Robert Clarke", role: "Club Player, 12hcp", quote: "I've been playing golf for 20 years. GolfGives added a whole new dimension. I won £1,200 last month and £120 went straight to cancer research. Amazing feeling.", avatar: "R" },
              { name: "Priya Sharma", role: "Amateur Golfer, 22hcp", quote: "The charity element made me actually care about my scores in a new way. Knowing every number I enter could help someone in need — that's powerful motivation.", avatar: "P" },
              { name: "Dave McAllister", role: "Weekend Golfer, 18hcp", quote: "Simple, exciting, purposeful. I check my scores against the draw every month. Nothing beats that moment when your numbers come up!", avatar: "D" },
            ].map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-card__stars">{'★★★★★'}</div>
                <p className="testimonial-card__quote">"{t.quote}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <p className="section-label">Subscription Plans</p>
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-card__header">
                <h3>Monthly</h3>
                <div className="pricing-card__price">
                  <span className="pricing-card__currency">£</span>
                  <span className="pricing-card__amount">9.99</span>
                  <span className="pricing-card__period">/month</span>
                </div>
              </div>
              <ul className="pricing-card__features">
                {['Enter up to 5 scores/month', 'Participate in monthly draw', 'Choose your charity', 'Manage donation %', 'Detailed dashboard', 'Winner verification'].map(f => (
                  <li key={f}><Check size={16} className="check-icon" />{f}</li>
                ))}
              </ul>
              <Link to={isAuthenticated && !isSubscribed ? "/subscribe" : "/signup"} className="btn-secondary pricing-card__btn">
                {isAuthenticated && !isSubscribed ? "Subscribe Now" : "Get Started"}
              </Link>
            </div>
            <div className="pricing-card pricing-card--featured">
              <div className="pricing-card__badge">Best Value</div>
              <div className="pricing-card__header">
                <h3>Yearly</h3>
                <div className="pricing-card__price">
                  <span className="pricing-card__currency">£</span>
                  <span className="pricing-card__amount">99</span>
                  <span className="pricing-card__period">/year</span>
                </div>
                <p className="pricing-card__saving">Save £20.88 vs monthly</p>
              </div>
              <ul className="pricing-card__features">
                {['All Monthly features', '12 draws included', 'Priority draw entry', 'Enhanced charity stats', 'Annual impact report', 'Dedicated support'].map(f => (
                  <li key={f}><Check size={16} className="check-icon" />{f}</li>
                ))}
              </ul>
              <Link to={isAuthenticated && !isSubscribed ? "/subscribe" : "/signup"} className="btn-primary pricing-card__btn">
                {isAuthenticated && !isSubscribed ? "Subscribe Now" : "Get Started"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner__orb" />
            <p className="section-label">Join Today</p>
            <h2>Your Next Swing Could <br /><em>Change Everything</em></h2>
            <p>Over 1,840 golfers are already playing, winning, and making a difference. Don't miss the January draw.</p>
            <div className="cta-banner__actions">
              <Link to="/signup" className="btn-primary cta-banner__btn">
                Join GolfGives <ArrowRight size={18} />
              </Link>
              <Link to="/charities" className="btn-secondary">
                <Heart size={16} /> Explore Charities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
