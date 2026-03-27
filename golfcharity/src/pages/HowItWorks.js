import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Check } from 'lucide-react';
import './HowItWorks.css';

export default function HowItWorks() {
  const { isAuthenticated } = useApp();
  return (
    <div className="hiw-page page-enter">
      <div className="hiw-hero">
        <div className="container">
          <p className="section-label">The Platform</p>
          <h1 className="hiw-hero__title">Simple Concept. <br /><em>Real Impact.</em></h1>
          <p className="hiw-hero__subtitle">
            GolfGives transforms your golf scores into lottery numbers, turning every round
            into a chance to win — and a chance to give.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Steps */}
        <div className="hiw-steps">
          {[
            {
              num: '01',
              icon: '💳',
              title: 'Subscribe to Enter',
              desc: 'Choose a monthly (£9.99) or yearly (£99) subscription. Your fee goes into the prize pool and towards charitable contributions. Cancel anytime.',
              details: ['No hidden fees', 'Instant account activation', 'Payment via Stripe (secure)', 'Auto-renewal handled gracefully'],
            },
            {
              num: '02',
              icon: '⛳',
              title: 'Enter Your Scores',
              desc: 'Submit up to 5 golf scores per month. Each score (1–45) acts as your lottery number for that month\'s draw. We only keep your most recent 5.',
              details: ['Scores must be 1–45', 'Newest score replaces oldest', 'Shown in reverse chronological order', 'Edit anytime before draw date'],
            },
            {
              num: '03',
              icon: '🎲',
              title: 'Monthly Draw Day',
              desc: 'On the last day of each month, 5 numbers are drawn at random. Match 3, 4, or all 5 of your scores to win your share of the prize pool.',
              details: ['Draw is fully transparent', 'Simulation run first', 'Results posted immediately', 'Winners notified by email'],
            },
            {
              num: '04',
              icon: '💰',
              title: 'Win & Get Paid',
              desc: 'Winners verify their identity by uploading a screenshot. Our admin team approves and processes payment. Most paid within 48 hours.',
              details: ['Upload verification proof', 'Admin approval process', 'Bank transfer or PayPal', 'Paid within 48 hours'],
            },
            {
              num: '05',
              icon: '💚',
              title: 'Charity Gets a Share',
              desc: 'From your winnings, a minimum of 10% (more if you choose) goes directly to your selected charity. Win more, give more.',
              details: ['Minimum 10% donation', 'You can give up to 50%', 'Monthly charity impact reports', 'Change charity anytime'],
            },
          ].map((step, i) => (
            <div className="hiw-step" key={i}>
              <div className="hiw-step__num">{step.num}</div>
              <div className="hiw-step__content">
                <div className="hiw-step__icon">{step.icon}</div>
                <h2 className="hiw-step__title">{step.title}</h2>
                <p className="hiw-step__desc">{step.desc}</p>
                <ul className="hiw-step__details">
                  {step.details.map((d, j) => (
                    <li key={j}><Check size={14} className="check-icon" />{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Prize Structure */}
        <div className="prize-structure">
          <p className="section-label">Prize Distribution</p>
          <h2 className="prize-structure__title">How Winnings Are Calculated</h2>
          <p className="prize-structure__desc">
            The monthly prize pool is built from all subscriber fees. It's split into three tiers based on how many numbers you match.
          </p>
          <div className="prize-structure__grid">
            {[
              { match: '5 Numbers', pct: 40, prize: 'Full jackpot', desc: 'If multiple winners, split equally. If no winner, jackpot rolls over to next month.', color: '#c9a84c', icon: '🏆' },
              { match: '4 Numbers', pct: 35, prize: '35% of pool', desc: 'Split equally among all 4-match winners that month.', color: '#93c5fd', icon: '⭐' },
              { match: '3 Numbers', pct: 25, prize: '25% of pool', desc: 'Split equally among all 3-match winners that month.', color: '#4ade80', icon: '✅' },
            ].map((tier, i) => (
              <div className="prize-structure__card" key={i} style={{ borderColor: `${tier.color}33` }}>
                <div className="prize-structure__icon">{tier.icon}</div>
                <h3 style={{ color: tier.color }}>{tier.match}</h3>
                <div className="prize-structure__pct" style={{ color: tier.color }}>
                  <span className="prize-structure__pct-num">{tier.pct}%</span>
                  <span>of prize pool</span>
                </div>
                <p>{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="hiw-faq">
          <p className="section-label">Questions</p>
          <h2 className="hiw-faq__title">Frequently Asked</h2>
          <div className="faq-grid">
            {[
              { q: 'What happens if I miss entering scores?', a: 'You can enter scores any time before the draw date. If you have no scores entered, you simply won\'t participate in that month\'s draw — but your subscription stays active.' },
              { q: 'Can I enter the same score multiple times?', a: 'Yes — if you played 72 three times, all three would be valid entries. Each score entry is independent.' },
              { q: 'Is the draw genuinely random?', a: 'Yes. We use a cryptographically secure random number generator. We also run a simulation mode before the final draw to ensure the system is working correctly.' },
              { q: 'What if no one wins the jackpot?', a: 'The 5-match jackpot rolls over to the following month, growing the prize pool. The 4-match and 3-match prizes are always awarded if there are enough participants.' },
              { q: 'How is my charity contribution calculated?', a: 'Your chosen percentage (minimum 10%) of your winnings is automatically donated to your selected charity. You can update this at any time in your dashboard.' },
              { q: 'Can I change my charity?', a: 'Absolutely. You can update your charity preference at any time from your dashboard. The change takes effect for future winnings.' },
            ].map((faq, i) => (
              <div className="faq-item" key={i}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="hiw-cta">
          <h2>Ready to <em>Play?</em></h2>
          <p>Join thousands of golfers making a difference with every round.</p>
          <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn-primary hiw-cta__btn">
            {isAuthenticated ? 'Go to Dashboard' : 'Create Your Account'} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
