import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Notification from './components/Notification';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscribe from './pages/Subscribe';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Charities from './pages/Charities';
import Draws from './pages/Draws';
import HowItWorks from './pages/HowItWorks';
import './styles/global.css';

function Layout({ children, noFooter }) {
  return (
    <>
      <Navbar />
      {children}
      {!noFooter && <Footer />}
    </>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function SubscriptionRoute({ children }) {
  const { isAuthenticated, isSubscriptionActive } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Allow access to dashboard even if subscription isn't active yet (webhook delay)
  // The Dashboard component will show renewal prompt if subscription expired
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Notification />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout noFooter><Login /></Layout>} />
          <Route path="/signup" element={<Layout noFooter><Signup /></Layout>} />
          <Route path="/subscribe" element={<Layout noFooter><PrivateRoute><Subscribe /></PrivateRoute></Layout>} />
          <Route path="/dashboard" element={<Layout><SubscriptionRoute><Dashboard /></SubscriptionRoute></Layout>} />
          <Route path="/charities" element={<Layout><Charities /></Layout>} />
          <Route path="/draws" element={<Layout><Draws /></Layout>} />
          <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={
            <Layout>
              <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', paddingTop: '80px' }}>
                <div style={{ fontSize: '4rem' }}>⛳</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Page Not Found</h1>
                <a href="/" className="btn-primary">Back to Home</a>
              </div>
            </Layout>
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
}
