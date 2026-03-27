import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Users, Trophy, Heart, BarChart3, Play, Plus,
  Trash2, Edit3, Check, X, RefreshCw, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Admin.css';

const TABS = [
  { id: 'analytics', label: 'Analytics',        icon: <BarChart3 size={16} /> },
  { id: 'users',     label: 'Users',             icon: <Users size={16} /> },
  { id: 'draws',     label: 'Draw Management',   icon: <Trophy size={16} /> },
  { id: 'charities', label: 'Charities',         icon: <Heart size={16} /> },
  { id: 'winners',   label: 'Winners',           icon: <Check size={16} /> },
];

function Analytics({ users, charities, draws, totalPrizePool }) {
  const activeUsers = users.filter(u => u.subscription === 'active').length;
  const totalWinnings = users.reduce((s, u) => s + (u.winnings || 0), 0);
  const totalCharity = users.reduce((s, u) => s + ((u.winnings || 0) * (u.charityPercent || 0) / 100), 0);

  const monthlyData = [
    { month: 'Aug', users: 820,  pool: 32000 },
    { month: 'Sep', users: 1050, pool: 38500 },
    { month: 'Oct', users: 1280, pool: 43000 },
    { month: 'Nov', users: 1540, pool: 46000 },
    { month: 'Dec', users: 1720, pool: 49000 },
    { month: 'Jan', users: 1840, pool: 52000 },
  ];

  const pieData = charities.slice(0, 4).map(c => ({ name: c.name.split(' ')[0], value: c.supporters }));
  const COLORS = ['#c9a84c', '#4ade80', '#93c5fd', '#f472b6'];

  return (
    <div className="admin-analytics">
      <div className="admin-stats-grid">
        {[
          { label: 'Active Subscribers', value: activeUsers, icon: <Users size={20} />, color: 'gold' },
          { label: 'Current Prize Pool', value: `£${totalPrizePool.toLocaleString()}`, icon: <Trophy size={20} />, color: 'green' },
          { label: 'Total Winnings Paid', value: `£${totalWinnings.toLocaleString()}`, icon: <BarChart3 size={20} />, color: 'blue' },
          { label: 'Total Charity Donated', value: `£${Math.round(totalCharity).toLocaleString()}`, icon: <Heart size={20} />, color: 'pink' },
        ].map((s, i) => (
          <div className="admin-stat" key={i}>
            <div className={`admin-stat__icon admin-stat__icon--${s.color}`}>{s.icon}</div>
            <div>
              <p className="admin-stat__value">{s.value}</p>
              <p className="admin-stat__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3>Subscriber Growth &amp; Prize Pool</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f0e8' }} />
              <Bar dataKey="users" fill="#c9a84c" opacity={0.8} radius={[3,3,0,0]} name="Users" />
              <Bar dataKey="pool"  fill="#2d8a57" opacity={0.6} radius={[3,3,0,0]} name="Pool (£)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Charity Supporters Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f5f0e8' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {pieData.map((d, i) => (
              <div key={i} className="pie-legend__item">
                <span style={{ background: COLORS[i] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, onUpdateUser }) {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const startEdit = (user) => {
    setEditId(user._id);
    setEditData({ plan: user.plan, subscription: user.subscription });
  };

  // FIX: was calling setUsers (from local state) — now calls the parent prop which hits the API
  const saveEdit = async () => {
    await onUpdateUser(editId, editData);
    setEditId(null);
  };

  return (
    <div>
      <h2 className="admin-section__title">User Management</h2>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th><th>Plan</th><th>Status</th><th>Scores</th><th>Winnings</th><th>Joined</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="table-user">
                    <div className="table-user__avatar">{user.name[0]}</div>
                    <div><p>{user.name}</p><span>{user.email}</span></div>
                  </div>
                </td>
                <td>
                  {editId === user._id ? (
                    <select className="input-field"
                      value={editData.plan} onChange={e => setEditData({ ...editData, plan: e.target.value })}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  ) : (
                    <span className="badge badge-blue">{user.plan}</span>
                  )}
                </td>
                <td>
                  {editId === user._id ? (
                    <select className="input-field"
                      value={editData.subscription} onChange={e => setEditData({ ...editData, subscription: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className={`badge ${user.subscription === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {user.subscription}
                    </span>
                  )}
                </td>
                <td><span className="badge badge-gray">{(user.scores || []).length}/5</span></td>
                <td>£{(user.winnings || 0).toLocaleString()}</td>
                <td style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>
                  {user.joined ? new Date(user.joined).toLocaleDateString('en-GB') : '-'}
                </td>
                <td>
                  <div className="table-actions">
                    {editId === user._id ? (
                      <>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={saveEdit}><Check size={14} /></button>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditId(null)}><X size={14} /></button>
                      </>
                    ) : (
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => startEdit(user)}><Edit3 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DrawsTab({ draws, runDraw, createDraw, deleteDraw }) {
  const [simResult, setSimResult] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ month: '', prizePool: 50000, jackpot: 20000 });

  const simulate = () => {
    const nums = new Set();
    while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
    setSimResult(Array.from(nums));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createDraw(form);
    setShowAdd(false);
    setForm({ month: '', prizePool: 50000, jackpot: 20000 });
  };

  return (
    <div>
      <div className="admin-section__header">
        <h2 className="admin-section__title">Draw Management</h2>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> New Draw
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="add-charity-form card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Create New Draw</h3>
          <div className="add-charity-form__grid">
            <div className="form-group">
              <label>Month Label (e.g. "February 2025")</label>
              <input className="input-field" placeholder="Month Year" value={form.month}
                onChange={e => setForm({ ...form, month: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Prize Pool (£)</label>
              <input type="number" className="input-field" value={form.prizePool}
                onChange={e => setForm({ ...form, prizePool: Number(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Jackpot (£)</label>
              <input type="number" className="input-field" value={form.jackpot}
                onChange={e => setForm({ ...form, jackpot: Number(e.target.value) })} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Create Draw</button>
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="draws-admin">
        {draws.map(draw => (
          <div className="draw-admin-card" key={draw._id}>
            <div className="draw-admin-card__header">
              <div>
                <h3>{draw.month}</h3>
                <span className={`badge ${draw.status === 'upcoming' ? 'badge-gold' : 'badge-green'}`}>{draw.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong className="draw-admin-card__pool">£{draw.prizePool.toLocaleString()}</strong>
                {draw.status !== 'completed' && (
                  <button className="btn-danger" style={{ padding: '6px 10px' }} onClick={() => deleteDraw(draw._id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {draw.status === 'upcoming' && (
              <div className="draw-admin-card__controls">
                <div className="simulation-area">
                  <h4>Simulation Mode</h4>
                  <p>Run a simulation to preview the draw logic before publishing.</p>
                  <button className="btn-secondary" style={{ width: 'fit-content' }} onClick={simulate}>
                    <RefreshCw size={14} /> Run Simulation
                  </button>
                  {simResult && (
                    <div className="sim-result">
                      <p className="sim-result__label">Simulated Numbers:</p>
                      <div className="lottery-balls" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                        {simResult.map((n, i) => (
                          <div key={i} className="lottery-ball" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{n}</div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '8px' }}>
                        This is a simulation only. Click "Run Final Draw" to publish official results.
                      </p>
                    </div>
                  )}
                </div>
                <button className="btn-primary" style={{ width: 'fit-content' }} onClick={() => runDraw(draw._id)}>
                  <Play size={14} /> Run Final Draw
                </button>
              </div>
            )}

            {draw.status === 'completed' && draw.numbers && draw.numbers.length > 0 && (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: '12px' }}>Winning Numbers:</p>
                <div className="lottery-balls" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                  {draw.numbers.map((n, i) => (
                    <div key={i} className="lottery-ball" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{n}</div>
                  ))}
                </div>
                <div className="draw-results-summary">
                  <div className="draw-result-item"><span>5-Match Winners</span><strong>{draw.winners5}</strong></div>
                  <div className="draw-result-item"><span>4-Match Winners</span><strong>{draw.winners4}</strong></div>
                  <div className="draw-result-item"><span>3-Match Winners</span><strong>{draw.winners3}</strong></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharitiesTab({ charities, createCharity, updateCharity, deleteCharity }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Health', description: '', goal: 100000, image: '💚', color: '#4ade80' });

  const handleAdd = async (e) => {
    e.preventDefault();
    await createCharity(form);
    setForm({ name: '', category: 'Health', description: '', goal: 100000, image: '💚', color: '#4ade80' });
    setShowAdd(false);
  };

  return (
    <div>
      <div className="admin-section__header">
        <h2 className="admin-section__title">Charity Management</h2>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Add Charity
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="add-charity-form card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>New Charity</h3>
          <div className="add-charity-form__grid">
            <div className="form-group">
              <label>Name</label>
              <input className="input-field" placeholder="Charity name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="input-field" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {['Health', 'Environment', 'Youth', 'Veterans', 'Hunger', 'Education'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Description</label>
              <textarea className="input-field" rows={3} placeholder="Brief description..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Fundraising Goal (£)</label>
              <input type="number" className="input-field" value={form.goal}
                onChange={e => setForm({ ...form, goal: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Icon (emoji)</label>
              <input className="input-field" value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Add Charity</button>
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="charities-admin-grid">
        {charities.map(c => (
          <div className="charity-admin-card" key={c._id}>
            <div className="charity-admin-card__top">
              <div className="all-charity-card__icon" style={{ background: `${c.color}22`, border: `1px solid ${c.color}44`, width: '40px', height: '40px', fontSize: '1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.image}
              </div>
              <div style={{ flex: 1 }}>
                <h3>{c.name}</h3>
                <span className="badge badge-gray">{c.category}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-secondary" style={{ padding: '6px 10px' }}
                  onClick={() => updateCharity(c._id, { featured: !c.featured })}>
                  {c.featured ? '★' : '☆'}
                </button>
                <button className="btn-danger" onClick={() => deleteCharity(c._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="charity-admin-card__stats">
              <div><span>Raised</span><strong>£{c.raised.toLocaleString()}</strong></div>
              <div><span>Goal</span><strong>£{c.goal.toLocaleString()}</strong></div>
              <div><span>Supporters</span><strong>{c.supporters}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinnersTab({ users, onApproveVerification }) {
  const [selectedTab, setSelectedTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const pending = users.filter(u => u.winnings > 0 && u.verificationStatus === 'pending');
  const approved = users.filter(u => u.winnings > 0 && u.verificationStatus === 'approved');
  const rejected = users.filter(u => u.winnings > 0 && u.verificationStatus === 'rejected');
  const none = users.filter(u => u.winnings > 0 && u.verificationStatus === 'none');

  const handleApprove = async (userId) => {
    setProcessing(true);
    try {
      await onApproveVerification(userId, true);
      setSelectedWinner(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (userId) => {
    setProcessing(true);
    try {
      await onApproveVerification(userId, false, rejectNote);
      setSelectedWinner(null);
      setRejectNote('');
    } finally {
      setProcessing(false);
    }
  };

  const renderWinnersList = (winnersList) => {
    if (winnersList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray)' }}>
          <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No winners in this category</p>
        </div>
      );
    }

    return (
      <div className="winners-list">
        {winnersList.map(user => (
          <div className="winner-admin-card" key={user._id}>
            <div className="table-user">
              <div className="table-user__avatar">{user.name[0]}</div>
              <div>
                <p style={{ fontWeight: 600 }}>{user.name}</p>
                <span>{user.email}</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Winnings</p>
              <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
                £{user.winnings.toLocaleString()}
              </strong>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Status</p>
              <span className={`badge ${
                user.verificationStatus === 'pending' ? 'badge-gold' :
                user.verificationStatus === 'approved' ? 'badge-green' :
                user.verificationStatus === 'rejected' ? 'badge-red' :
                'badge-gray'
              }`}>
                {user.verificationStatus === 'approved' ? '✓ Approved' :
                 user.verificationStatus === 'rejected' ? '✗ Rejected' :
                 user.verificationStatus === 'pending' ? '⏳ Pending Review' :
                 'Not Submitted'}
              </span>
            </div>
            {(user.verificationStatus === 'pending' || user.verificationStatus === 'approved' || user.verificationStatus === 'rejected') && (
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => setSelectedWinner(user)}>
                View Proof
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="admin-section__title">Winners Verification Management</h2>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {[
          { id: 'pending', label: '⏳ Pending Review', count: pending.length, color: 'gold' },
          { id: 'approved', label: '✓ Approved', count: approved.length, color: 'green' },
          { id: 'rejected', label: '✗ Rejected', count: rejected.length, color: 'red' },
          { id: 'none', label: 'Not Submitted', count: none.length, color: 'gray' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: selectedTab === tab.id ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: 'none',
              borderBottom: selectedTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: selectedTab === tab.id ? 'var(--white)' : 'var(--gray)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: selectedTab === tab.id ? 600 : 400,
              transition: 'all 0.2s'
            }}>
            {tab.label} <span style={{ fontSize: '0.8rem', marginLeft: '6px', opacity: 0.7 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {selectedTab === 'pending' && renderWinnersList(pending)}
      {selectedTab === 'approved' && renderWinnersList(approved)}
      {selectedTab === 'rejected' && renderWinnersList(rejected)}
      {selectedTab === 'none' && renderWinnersList(none)}

      {/* Proof Modal */}
      {selectedWinner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedWinner(null)}>
          <div style={{
            background: 'var(--black)', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%',
            border: '1px solid rgba(201,168,76,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>
              Verification Proof - {selectedWinner.name}
            </h3>

            {selectedWinner.verificationProofUrl ? (
              <div style={{ marginBottom: '24px' }}>
                <img 
                  src={selectedWinner.verificationProofUrl} 
                  alt="Verification Proof"
                  style={{ width: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover', marginBottom: '12px' }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                  Winnings: <strong style={{ color: 'var(--gold)' }}>£{selectedWinner.winnings.toLocaleString()}</strong>
                </p>
              </div>
            ) : (
              <div style={{ padding: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', color: 'var(--gray)' }}>
                No proof image available
              </div>
            )}

            {selectedWinner.verificationStatus === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--gray)', display: 'block', marginBottom: '6px' }}>
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    style={{
                      width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '0.85rem',
                      fontFamily: 'inherit', resize: 'vertical', minHeight: '60px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(selectedWinner._id)}
                    disabled={processing}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', opacity: processing ? 0.5 : 1 }}>
                    <Check size={16} /> {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedWinner._id)}
                    disabled={processing}
                    className="btn-danger"
                    style={{ justifyContent: 'center', opacity: processing ? 0.5 : 1 }}>
                    <X size={16} /> {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}

            {selectedWinner.verificationStatus === 'approved' && (
              <div style={{ padding: '12px', background: 'rgba(74,222,128,0.1)', borderRadius: '6px', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '0.9rem' }}>
                ✓ This verification has been approved
              </div>
            )}

            {selectedWinner.verificationStatus === 'rejected' && (
              <div style={{ padding: '12px', background: 'rgba(248,113,113,0.1)', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '0.9rem' }}>
                ✗ This verification has been rejected
              </div>
            )}

            <button
              onClick={() => setSelectedWinner(null)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  // FIX: removed setUsers (doesn't exist in context), totalPrizePool now comes from context
  // FIX: addCharity renamed to createCharity in context
  const {
    currentUser, users, charities, draws, totalPrizePool,
    createCharity, updateCharity, deleteCharity,
    createDraw, deleteDraw, runDraw,
    loadUsers, approveVerification
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('analytics');

  // Load users when admin panel mounts
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // FIX: use useApp's updateUser via API
  const { updateUser } = require('../api').default ? { updateUser: null } : {};

  const handleUpdateUser = async (id, data) => {
    try {
      const api = (await import('../api')).default;
      await api.updateUser(id, data);
      await loadUsers(); // Reload users from API
    } catch (e) {
      console.error('Update user failed', e);
    }
  };

  const handleApproveVerification = async (userId, approved, rejectionNote = '') => {
    const result = await approveVerification(userId, approved, rejectionNote);
    if (result.success) {
      // Reload users to reflect the change
      await loadUsers();
    }
    return result;
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }
  if (currentUser.role !== 'admin') {
    navigate('/');
    return null;
  }

  return (
    <div className="admin-page page-enter">
      <div className="admin-sidebar">
        <div className="admin-sidebar__logo">⛳ Admin</div>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-sidebar__btn ${tab === t.id ? 'admin-sidebar__btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <button className="admin-sidebar__btn" style={{ marginTop: 'auto', color: 'var(--gray)' }}
          onClick={() => navigate('/')}>
          ← Back to Site
        </button>
      </div>

      <div className="admin-main">
        <div className="admin-main__header">
          <div>
            <h1 className="admin-main__title">{TABS.find(t => t.id === tab)?.label}</h1>
            <p className="admin-main__sub">GolfGives Admin Panel</p>
          </div>
          <div className="badge badge-gold">Admin Access</div>
        </div>

        <div className="admin-content">
          {tab === 'analytics'  && <Analytics users={users} charities={charities} draws={draws} totalPrizePool={totalPrizePool} />}
          {tab === 'users'      && <UsersTab users={users} onUpdateUser={handleUpdateUser} />}
          {tab === 'draws'      && <DrawsTab draws={draws} runDraw={runDraw} createDraw={createDraw} deleteDraw={deleteDraw} />}
          {tab === 'charities'  && <CharitiesTab charities={charities} createCharity={createCharity} updateCharity={updateCharity} deleteCharity={deleteCharity} />}
          {tab === 'winners'    && <WinnersTab users={users} onApproveVerification={handleApproveVerification} />}
        </div>
      </div>
    </div>
  );
}
