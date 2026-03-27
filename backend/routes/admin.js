const express = require('express');
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'subscriber' });
    const activeUsers = await User.countDocuments({ role: 'subscriber', subscription: 'active' });
    const totalCharities = await Charity.countDocuments();
    const totalRaisedAgg = await Charity.aggregate([{ $group: { _id: null, total: { $sum: '$raised' } } }]);
    const totalDraws = await Draw.countDocuments();
    const upcomingDraw = await Draw.findOne({ status: 'upcoming' });

    res.json({
      totalUsers,
      activeUsers,
      totalCharities,
      totalRaised: totalRaisedAgg[0]?.total || 0,
      totalDraws,
      currentPrizePool: upcomingDraw?.prizePool || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'subscriber' })
      .select('-password')
      .populate('charity', 'name image');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin only)
router.put('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    // Don't allow password changes from this endpoint
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password')
      .populate('charity', 'name image');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending verifications (winners waiting for approval)
router.get('/verifications/pending', auth, adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      verificationStatus: 'pending',
      winnings: { $gt: 0 }
    })
      .select('-password')
      .populate('charity', 'name image')
      .sort({ joined: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or reject verification
router.post('/verifications/:userId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved, rejectionNote } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (approved) {
      user.verificationStatus = 'approved';
      console.log(`✅ Verification approved for user ${user.name} (${user.email})`);
    } else {
      user.verificationStatus = 'rejected';
      console.log(`❌ Verification rejected for user ${user.name} (${user.email}). Note: ${rejectionNote || 'none'}`);
    }

    await user.save();

    res.json({
      message: approved ? 'Verification approved' : 'Verification rejected',
      user: user.toObject({ getters: true, virtuals: false })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
