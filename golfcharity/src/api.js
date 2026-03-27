const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('golfgives_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('golfgives_token', token);
    } else {
      localStorage.removeItem('golfgives_token');
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async updateProfile(updates) {
    return await this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async addScore(score) {
    return await this.request('/auth/me/scores', {
      method: 'POST',
      body: JSON.stringify(score)
    });
  }

  // Charities
  async getCharities() {
    return await this.request('/charities');
  }

  async getFeaturedCharities() {
    return await this.request('/charities/featured');
  }

  async createCharity(charityData) {
    return await this.request('/charities', {
      method: 'POST',
      body: JSON.stringify(charityData)
    });
  }

  async updateCharity(id, charityData) {
    return await this.request(`/charities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(charityData)
    });
  }

  async deleteCharity(id) {
    return await this.request(`/charities/${id}`, { method: 'DELETE' });
  }

  // Draws
  async getDraws() {
    return await this.request('/draws');
  }

  async getUpcomingDraw() {
    return await this.request('/draws/upcoming');
  }

  async createDraw(drawData) {
    return await this.request('/draws', {
      method: 'POST',
      body: JSON.stringify(drawData)
    });
  }

  async updateDraw(id, drawData) {
    return await this.request(`/draws/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drawData)
    });
  }

  // FIX: this method was missing — AppContext called it but it didn't exist
  async deleteDraw(id) {
    return await this.request(`/draws/${id}`, { method: 'DELETE' });
  }

  async runDraw(id) {
    return await this.request(`/draws/${id}/run`, { method: 'POST' });
  }

  // Admin
  async getAdminStats() {
    return await this.request('/admin/stats');
  }

  async getAllUsers() {
    return await this.request('/admin/users');
  }

  async updateUser(id, userData) {
    return await this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Payments
  async getStripeConfig() {
    return await this.request('/payments/config');
  }

  async createCheckoutSession(plan) {
    return await this.request('/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  }

  async createDonationSession(charityId, amount) {
    return await this.request('/payments/create-donation-session', {
      method: 'POST',
      body: JSON.stringify({ charityId, amount })
    });
  }

  async checkSubscription() {
    return await this.request('/payments/check-subscription', {
      method: 'POST'
    });
  }

  async donateToCharity(charityId, amount) {
    return await this.request(`/charities/${charityId}/donate`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async requestDrawVerification(drawId, proofUrl, proofDataUrlOrFile) {
    // Handle file upload (new method)
    if (proofDataUrlOrFile instanceof File) {
      const formData = new FormData();
      formData.append('drawId', drawId);
      formData.append('proofFile', proofDataUrlOrFile);

      const response = await fetch(`${API_BASE}/draws/verify`, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` })
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification request failed');
      }
      return data;
    }

    // Handle URL-based (old method, deprecated)
    return await this.request('/draws/verify', {
      method: 'POST',
      body: JSON.stringify({ drawId, proofUrl, proofDataUrl: proofDataUrlOrFile })
    });
  }

  // Admin: Get pending verifications
  async getPendingVerifications() {
    return await this.request('/admin/verifications/pending');
  }

  // Admin: Approve/Reject verification
  async approveVerification(userId, approved, rejectionNote = '') {
    return await this.request(`/admin/verifications/${userId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, rejectionNote })
    });
  }
}


export default new ApiService();
