import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        // Check for saved auth
        const savedToken = localStorage.getItem('golfgives_token');
        if (savedToken) {
          api.setToken(savedToken);
          try {
            const { user } = await api.getCurrentUser();
            setCurrentUser(user);
          } catch {
            // Token invalid, clear it
            api.setToken(null);
            localStorage.removeItem('golfgives_token');
          }
        }

        // Load public data
        const [charitiesData, drawsData] = await Promise.all([
          api.getCharities(),
          api.getDraws()
        ]);
        setCharities(charitiesData);
        setDraws(drawsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        showNotification('Failed to connect to server. Is the backend running?', 'error');
      } finally {
        setLoading(false);
      }
    };

    initData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // NEW: Sync subscription status with Stripe
  const syncSubscription = async () => {
    if (!currentUser) return;
    try {
      console.log('🔄 Syncing subscription status with Stripe...');
      const response = await api.checkSubscription();
      if (response.user) {
        console.log('✅ Subscription synced:', response.user.subscription);
        setCurrentUser(response.user);
        return response.user;
      }
    } catch (error) {
      console.error('❌ Subscription sync error:', error.message);
    }
  };

  // FIX: was missing await — login() is async, result was a Promise not an object
  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      setCurrentUser(data.user);
      showNotification(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      
      // NEW: Sync subscription status after login
      setTimeout(() => {
        syncSubscription();
      }, 500);
      
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // FIX: was missing await — signup() is async
  const signup = async (userData) => {
    try {
      const data = await api.register(userData);
      setCurrentUser(data.user);
      showNotification('Account created! Welcome to GolfGives 🎉');
      
      // NEW: Sync subscription status after signup
      setTimeout(() => {
        syncSubscription();
      }, 500);
      
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    api.setToken(null);
    showNotification('Logged out successfully', 'info');
  };

  const addScore = async (score) => {
    if (!currentUser) return;
    try {
      const data = await api.addScore(score);
      setCurrentUser(data.user);
      showNotification('Score added successfully!');
    } catch (error) {
      showNotification('Failed to add score', 'error');
    }
  };

  const runDraw = async (id) => {
    try {
      const updated = await api.runDraw(id);
      setDraws(prev => prev.map(d => d._id === id ? updated : d));
      showNotification('Draw completed successfully!');
    } catch (error) {
      showNotification('Failed to run draw', 'error');
    }
  };

  const updateCharityPreference = async (charityId, percent) => {
    try {
      const data = await api.updateProfile({ charity: charityId, charityPercent: percent });
      setCurrentUser(data.user);
      showNotification('Charity preference updated!');
    } catch (error) {
      showNotification('Failed to update charity preference', 'error');
    }
  };

  const subscribe = async (plan = 'monthly') => {
    try {
      const data = await api.createCheckoutSession(plan);
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        showNotification(`Subscription failed: ${data.message}`, 'error');
      } else {
        showNotification('No payment session created. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showNotification(error.message || 'Subscription checkout failed', 'error');
    }
  };

  const donateToCharity = async (charityId, amount) => {
    try {
      if (!currentUser) throw new Error('Login required to donate');
      const data = await api.createDonationSession(charityId, amount);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      showNotification(error.message || 'Donation checkout failed', 'error');
    }
  };

  const donateDirect = async (charityId, amount) => {
    try {
      const data = await api.donateToCharity(charityId, amount);
      setCharities(prev => prev.map(c => c._id === charityId ? data.charity : c));
      showNotification(data.message);
      return { success: true };
    } catch (error) {
      showNotification(error.message || 'Donation failed', 'error');
      return { success: false, error: error.message };
    }
  };

  const requestVerification = async ({ drawId, proofUrl, proofDataUrl, proofFile }) => {
    try {
      const data = await api.requestDrawVerification(drawId, proofUrl, proofFile || proofDataUrl);
      setCurrentUser(data.user);
      showNotification(data.message);
      return { success: true };
    } catch (error) {
      showNotification(error.message || 'Verification request failed', 'error');
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const data = await api.updateProfile(updates);
      setCurrentUser(data.user);
      showNotification('Profile updated successfully!');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    }
  };

  // Helper to update current user from API fetch (used during webhook polling)
  const setCurrentUserFromFetch = (user) => {
    setCurrentUser(user);
  };

  // Admin functions
  const loadUsers = async () => {
    if (currentUser?.role !== 'admin') return;
    try {
      const usersData = await api.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      showNotification('Failed to load users', 'error');
    }
  };

  const updateCharity = async (id, data) => {
    try {
      const updated = await api.updateCharity(id, data);
      setCharities(prev => prev.map(c => c._id === id ? updated : c));
      showNotification('Charity updated successfully');
    } catch (error) {
      showNotification('Failed to update charity', 'error');
    }
  };

  // FIX: was named addCharity in Admin.js but exported as createCharity — standardised to createCharity
  const createCharity = async (data) => {
    try {
      const newCharity = await api.createCharity(data);
      setCharities(prev => [...prev, newCharity]);
      showNotification('Charity created successfully');
    } catch (error) {
      showNotification('Failed to create charity', 'error');
    }
  };

  const deleteCharity = async (id) => {
    try {
      await api.deleteCharity(id);
      setCharities(prev => prev.filter(c => c._id !== id));
      showNotification('Charity deleted successfully');
    } catch (error) {
      showNotification('Failed to delete charity', 'error');
    }
  };

  const updateDraw = async (id, data) => {
    try {
      const updated = await api.updateDraw(id, data);
      setDraws(prev => prev.map(d => d._id === id ? updated : d));
      showNotification('Draw updated successfully');
    } catch (error) {
      showNotification('Failed to update draw', 'error');
    }
  };

  const createDraw = async (data) => {
    try {
      const newDraw = await api.createDraw(data);
      setDraws(prev => [...prev, newDraw]);
      showNotification('Draw created successfully');
    } catch (error) {
      showNotification('Failed to create draw', 'error');
    }
  };

  const deleteDraw = async (id) => {
    try {
      await api.deleteDraw(id);
      setDraws(prev => prev.filter(d => d._id !== id));
      showNotification('Draw deleted successfully');
    } catch (error) {
      showNotification('Failed to delete draw', 'error');
    }
  };

  const approveVerification = async (userId, approved, rejectionNote = '') => {
    try {
      const data = await api.approveVerification(userId, approved, rejectionNote);
      setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
      showNotification(data.message);
      return { success: true };
    } catch (error) {
      showNotification(error.message || 'Verification update failed', 'error');
      return { success: false, error: error.message };
    }
  };

  // FIX: totalPrizePool was used in Admin.js but never computed/exported
  const totalPrizePool = draws.find(d => d.status === 'upcoming')?.prizePool || 0;

  const isAuthenticated = !!currentUser;
  const isSubscriptionActive = currentUser?.subscription === 'active';

  const value = {
    currentUser,
    isAuthenticated,
    isSubscriptionActive,
    users,
    setUsers,   // FIX: Admin.js destructures setUsers from context
    charities,
    draws,
    notification,
    loading,
    totalPrizePool,
    login,
    signup,
    logout,
    addScore,
    updateProfile,
    updateCharityPreference,
    subscribe,
    donateToCharity,
    donateDirect,
    requestVerification,
    approveVerification,
    runDraw,
    loadUsers,
    updateCharity,
    createCharity,
    deleteCharity,
    updateDraw,
    createDraw,
    deleteDraw,
    showNotification,
    setCurrentUserFromFetch,
    syncSubscription
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
