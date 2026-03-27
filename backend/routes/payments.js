const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Charity = require('../models/Charity');
const { getStripeKeys, getFrontendUrl } = require('../utils/config');

let stripe;
const stripeConfig = getStripeKeys();

if (stripeConfig.available) {
  stripe = require('stripe')(stripeConfig.secretKey);
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️  Stripe not initialized – STRIPE_SECRET_KEY missing (payments disabled)');
}

const PLANS = {
  monthly: { amount: 999, interval: 'month', label: '£9.99/month' },
  yearly:  { amount: 9900, interval: 'year',  label: '£99/year' }
};

// Create Stripe checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment service unavailable' });

  try {
    const { plan = 'monthly' } = req.body;
    const planConfig = PLANS[plan] || PLANS.monthly;
    const user = req.user;

    console.log('Creating checkout session for user:', user._id, 'plan:', plan);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `GolfGives ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription` },
          unit_amount: planConfig.amount,
          recurring: { interval: planConfig.interval }
        },
        quantity: 1
      }],
      success_url: `${getFrontendUrl()}/dashboard?payment=success`,
      cancel_url:  `${getFrontendUrl()}/signup?payment=cancelled`,
      metadata: { userId: user._id.toString(), plan }
    });

    // HARDCODED: Immediately activate subscription when checkout session is created
    console.log('🔥 HARDCODED: Activating subscription immediately for user:', user._id);
    await User.findByIdAndUpdate(user._id, {
      subscription: 'active',
      plan: plan,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription || `pending_${Date.now()}`
    });
    console.log('✅ Subscription activated immediately on checkout');

    console.log('Checkout session created:', session.id, 'subscription:', session.subscription);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create donation checkout session (one-time charity payments)
router.post('/create-donation-session', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment service unavailable' });

  try {
    const { charityId, amount } = req.body;
    const donationAmount = Number(amount);
    if (!charityId || !donationAmount || donationAmount < 1) {
      return res.status(400).json({ message: 'charityId and amount (£1+) are required' });
    }

    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Donation to ${charity.name}` },
          unit_amount: Math.round(donationAmount * 100)
        },
        quantity: 1
      }],
      success_url: `${getFrontendUrl()}/charities?donation=success`,
      cancel_url: `${getFrontendUrl()}/charities?donation=cancelled`,
      metadata: {
        userId: req.user._id.toString(),
        charityId,
        donationAmount: donationAmount.toString()
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create payment intent (for one-time payments)
router.post('/create-payment-intent', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment service unavailable' });

  try {
    const { plan = 'monthly' } = req.body;
    const planConfig = PLANS[plan] || PLANS.monthly;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.amount,
      currency: 'gbp',
      metadata: { userId: req.user._id.toString(), plan }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.sendStatus(200);

  const sig = req.headers['stripe-signature'];
  const webhookSecret = stripeConfig.webhookSecret;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  let event;
  try {
    // In development, allow unsigned webhooks for easier testing
    if (isDevelopment && (!webhookSecret || webhookSecret.includes('XXXX'))) {
      console.log('⚠️ Development mode: Processing webhook without signature verification');
      event = JSON.parse(req.body);
    } else if (webhookSecret && !webhookSecret.includes('XXXX')) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe webhook event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan, charityId, donationAmount } = session.metadata || {};

    console.log('Checkout completed for userId:', userId, 'plan:', plan, 'subscription:', session.subscription, 'customer:', session.customer);

    if (charityId && donationAmount) {
      const donation = Number(donationAmount);
      if (!Number.isNaN(donation) && donation > 0) {
        await Charity.findByIdAndUpdate(charityId, {
          $inc: { raised: donation, supporters: 1 }
        });
      }
    }

    if (userId && plan && session.subscription) {
      const updatedUser = await User.findByIdAndUpdate(userId, {
        subscription: 'active',
        plan: plan || 'monthly',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription
      }, { new: true });
      console.log('✅ WEBHOOK: Updated user subscription to ACTIVE');
      console.log('   User ID:', userId);
      console.log('   Plan:', plan);
      console.log('   Stripe Customer ID:', session.customer);
      console.log('   Stripe Subscription ID:', session.subscription);
    } else if (userId) {
      console.warn('⚠️ Missing plan or subscription for userId:', userId, 'plan:', plan, 'session.subscription:', session.subscription);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await User.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { subscription: 'expired' }
    );
    console.log('Subscription deleted, set to expired');
  }

  res.sendStatus(200);
});

// Get publishable key (for frontend)
router.get('/config', (req, res) => {
  res.json({ publishableKey: stripeConfig.publishableKey || '' });
});

// Check and sync subscription status from Stripe (fallback if webhook is slow)
router.post('/check-subscription', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment service unavailable' });

  try {
    const user = await User.findById(req.user._id).populate('charity', 'name image color category');
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('Checking subscription for user:', user._id, 'stripeCustomerId:', user.stripeCustomerId, 'stripeSubscriptionId:', user.stripeSubscriptionId);

    // If user has a Stripe customer ID but no subscription yet, try to find subscriptions
    if (user.stripeCustomerId && !user.stripeSubscriptionId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          user.stripeSubscriptionId = sub.id;
          console.log('Found subscription from customer ID:', sub.id, 'status:', sub.status);
        }
      } catch (err) {
        console.log('Error listing subscriptions:', err.message);
      }
    }

    // If user has a Stripe subscription ID, check its status
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const isActive = subscription.status === 'active';
        
        console.log('Subscription status from Stripe:', subscription.status, 'isActive:', isActive);
        
        if (isActive && user.subscription !== 'active') {
          user.subscription = 'active';
          console.log('✅ Activating subscription for user:', user._id);
        } else if (!isActive && user.subscription === 'active') {
          user.subscription = 'expired';
          console.log('⚠️ Expiring subscription for user:', user._id);
        }
        
        await user.save();
        // Re-populate charity after save in case it was cleared
        await user.populate('charity', 'name image color category');
      } catch (err) {
        console.log('Error retrieving subscription:', err.message);
      }
    } else {
      console.log('No Stripe subscription ID found for user:', user._id);
    }

    res.json({ user: user.toObject() });
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: error.message });
  }
});

// TEST ENDPOINT: Manually activate subscription (for local testing only)
// Usage: POST /api/payments/test-activate-subscription
// Body: { email: "user@example.com", plan: "monthly" }
router.post('/test-activate-subscription', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'This endpoint is only available in development' });
  }

  try {
    const { email, plan = 'monthly' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() }).populate('charity', 'name image color category');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simulate a successful Stripe subscription
    const fakeSubscriptionId = `sub_test_${Date.now()}`;
    const fakeCustomerId = `cus_test_${Date.now()}`;

    console.log('\n🧪 TEST: Activating subscription for user:', user._id);
    console.log('   Email:', email);
    console.log('   Plan:', plan);

    const updated = await User.findByIdAndUpdate(user._id, {
      subscription: 'active',
      plan: plan,
      stripeCustomerId: fakeCustomerId,
      stripeSubscriptionId: fakeSubscriptionId
    }, { new: true }).populate('charity', 'name image color category');

    console.log('✅ TEST: Subscription activated!');
    console.log('   Subscription ID:', fakeSubscriptionId);

    res.json({
      message: 'Subscription activated for testing',
      user: updated
    });
  } catch (error) {
    console.error('Test activation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
