const express = require('express');
const Charity = require('../models/Charity');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all charities
router.get('/', async (req, res) => {
  try {
    const charities = await Charity.find().sort({ featured: -1, supporters: -1 });
    res.json(charities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured charities
router.get('/featured', async (req, res) => {
  try {
    const charities = await Charity.find({ featured: true });
    res.json(charities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create charity (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, category, description, goal } = req.body;
    if (!name || !category || !description || !goal) {
      return res.status(400).json({ message: 'name, category, description and goal are required' });
    }
    const charity = new Charity(req.body);
    await charity.save();
    res.status(201).json(charity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update charity (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!charity) return res.status(404).json({ message: 'Charity not found' });
    res.json(charity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Donate directly to charity (authenticated users)
router.post('/:id/donate', auth, async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    const amount = Number(req.body.amount);
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Donation amount must be at least £1' });
    }

    charity.raised = (charity.raised || 0) + amount;
    charity.supporters = (charity.supporters || 0) + 1;
    await charity.save();

    res.json({ charity, message: `Thank you for donating £${amount} to ${charity.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete charity (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const charity = await Charity.findByIdAndDelete(req.params.id);
    if (!charity) return res.status(404).json({ message: 'Charity not found' });
    res.json({ message: 'Charity deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
