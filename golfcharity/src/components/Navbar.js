import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">⛳</span>
          <span className="navbar__logo-text">Golf<span className="navbar__logo-accent">Gives</span></span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <Link to="/" className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}>Home</Link>
          <Link to="/charities" className={`navbar__link ${isActive('/charities') ? 'navbar__link--active' : ''}`}>Charities</Link>
          <Link to="/how-it-works" className={`navbar__link ${isActive('/how-it-works') ? 'navbar__link--active' : ''}`}>How It Works</Link>
          <Link to="/draws" className={`navbar__link ${isActive('/draws') ? 'navbar__link--active' : ''}`}>Draws</Link>

          {!currentUser && (
            <div className="navbar__actions">
              <Link to="/login" className="btn-secondary" style={{ padding: '8px 20px' }}>Login</Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px' }}>Get Started</Link>
            </div>
          )}
        </div>

        {currentUser && (
          <div className="navbar__user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="navbar__avatar">{currentUser.name[0]}</div>
            <span className="navbar__username">{currentUser.name.split(' ')[0]}</span>
            <ChevronDown size={16} className={`navbar__chevron ${dropdownOpen ? 'navbar__chevron--open' : ''}`} />
            {dropdownOpen && (
              <div className="navbar__dropdown">
                {currentUser.role === 'admin' ? (
                  <Link to="/admin" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Settings size={16} /> Admin Panel
                  </Link>
                ) : (
                  <Link to="/dashboard" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                )}
                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        )}

        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}
