const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getJWTSecret, getStripeKeys } = require('../utils/config');

const router = express.Router();
const JWT_SECRET = getJWTSecret();

// Initialize Stripe
let stripe;
const stripeConfig = getStripeKeys();
if (stripeConfig.available) {
  stripe = require('stripe')(stripeConfig.secretKey);
  console.log('✅ Stripe initialized in auth routes');
} else {
  console.warn('⚠️ Stripe not initialized in auth routes – STRIPE_SECRET_KEY missing');
}

// Helper function to sync subscription status with Stripe
async function syncSubscriptionStatus(user) {
  console.log('\n🔄 === SYNC SUBSCRIPTION STATUS ===');
  console.log('User ID:', user._id);
  console.log('Current subscription in DB:', user.subscription);
  console.log('Stripe Customer ID:', user.stripeCustomerId);
  console.log('Stripe Subscription ID:', user.stripeSubscriptionId);

  if (!stripe) {
    console.log('❌ Stripe not initialized');
    return user;
  }

  if (!user.stripeSubscriptionId) {
    console.log('⚠️ No Stripe subscription ID found - subscription not active yet');
    return user;
  }

  try {
    console.log('📡 Fetching subscription from Stripe...');
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const isActive = subscription.status === 'active';
    
    console.log('Stripe subscription status:', subscription.status);
    console.log('Is Active?:', isActive);
    
    if (isActive && user.subscription !== 'active') {
      console.log('✅ Updating DB: expired → ACTIVE');
      const updated = await User.findByIdAndUpdate(user._id, { subscription: 'active' }, { new: true });
      const reloaded = await User.findById(user._id).populate('charity', 'name image color category');
      console.log('✅ User subscription updated to ACTIVE');
      console.log('=== END SYNC ===\n');
      return reloaded;
    } else if (!isActive && user.subscription === 'active') {
      console.log('⚠️ Updating DB: active → EXPIRED');
      const reloaded = await User.findByIdAndUpdate(user._id, { subscription: 'expired' }, { new: true }).populate('charity', 'name image color category');
      console.log('⚠️ User subscription set to EXPIRED');
      console.log('=== END SYNC ===\n');
      return reloaded;
    } else {
      console.log('✓ Subscription status unchanged:', user.subscription);
      console.log('=== END SYNC ===\n');
    }
  } catch (err) {
    console.error('❌ Error syncing subscription:', err.message);
    console.log('=== END SYNC (ERROR) ===\n');
  }

  return user;
}

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8)
    .pattern(new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])'))
    .message('Password must have at least one uppercase letter, one lowercase letter, one number, and one special character')
    .required(),
  plan: Joi.string().valid('monthly', 'yearly').default('monthly'),
  charity: Joi.string().optional().allow(''),
  charityPercent: Joi.number().integer().min(10).max(50).default(10)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map(d => d.message) });
    }

    const { name, email, password, plan, charity, charityPercent } = value;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // HARDCODED: Set subscription to "active" by default for new users
    const userData = { name, email, password, plan: plan || 'monthly', subscription: 'active' };
    if (charity) userData.charity = charity;
    if (charityPercent) userData.charityPercent = charityPercent;

    console.log('🔥 HARDCODED: Registering user with subscription: ACTIVE');

    let user = new User(userData);
    await user.save();

    // Populate charity details
    await user.populate('charity', 'name image color category');

    // Sync subscription status with Stripe (in case user already has a subscription)
    user = await syncSubscriptionStatus(user);
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscription: user.subscription, charity: user.charity, charityPercent: user.charityPercent, scores: user.scores, winnings: user.winnings, joined: user.joined },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map(d => d.message) });
    }

    const { email, password } = value;

    console.log('\n📍 LOGIN: Finding user:', email);
    let user = await User.findOne({ email: email.toLowerCase() }).populate('charity', 'name image color category');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✓ User found. Before sync - subscription:', user.subscription);
    
    // Sync subscription status with Stripe before login
    user = await syncSubscriptionStatus(user);

    console.log('✓ After sync - subscription:', user.subscription);
    console.log('📍 LOGIN: Returning user with subscription:', user.subscription);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        plan: user.plan, subscription: user.subscription, charity: user.charity,
        charityPercent: user.charityPercent, scores: user.scores,
        winnings: user.winnings, joined: user.joined
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).populate('charity', 'name image color category');
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // Sync subscription status on every fetch
    user = await syncSubscriptionStatus(user);
    
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscription: user.subscription, charity: user.charity, charityPercent: user.charityPercent, scores: user.scores, winnings: user.winnings, joined: user.joined } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const allowedFields = ['name', 'charity', 'charityPercent'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password')
      .populate('charity', 'name image color category');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add score
router.post('/me/scores', auth, async (req, res) => {
  try {
    const { value, date } = req.body;
    const numVal = Number(value);
    if (!numVal || numVal < 1 || numVal > 45) {
      return res.status(400).json({ message: 'Score must be between 1 and 45' });
    }

    const score = { value: numVal, date: date || new Date() };
    const user = await User.findById(req.user._id);
    user.scores.unshift(score);
    user.scores = user.scores.slice(0, 5); // Keep only latest 5
    await user.save();

    await user.populate('charity', 'name image color category');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
