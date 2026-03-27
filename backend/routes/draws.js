const express = require('express');
const multer = require('multer');
const Draw = require('../models/Draw');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadFromDataUrl } = require('../utils/cloudinary');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all draws
router.get('/', async (req, res) => {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    res.json(draws);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming draw
router.get('/upcoming', async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: 'upcoming' });
    res.json(draw || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request verification for a win by uploading proof file (image)
router.post('/verify', auth, upload.single('proofFile'), async (req, res) => {
  try {
    const { drawId } = req.body;
    
    if (!drawId || drawId === 'undefined') {
      console.warn('❌ Missing or invalid drawId:', drawId);
      return res.status(400).json({ message: 'drawId is required and must be valid' });
    }

    // Validate ObjectId format
    if (!require('mongoose').Types.ObjectId.isValid(drawId)) {
      console.warn('❌ Invalid ObjectId format:', drawId);
      return res.status(400).json({ message: 'Invalid draw ID format' });
    }

    if (!req.file && !req.body.proofUrl && !req.body.proofDataUrl) {
      return res.status(400).json({ message: 'Proof file, proofUrl, or proofDataUrl is required' });
    }

    const draw = await Draw.findById(drawId);
    if (!draw) return res.status(404).json({ message: 'Draw not found' });

    const user = await User.findById(req.user._id);
    let storedUrl = null;

    // Handle file upload
    if (req.file) {
      console.log('📤 Uploading verification file:', req.file.originalname);
      // Convert buffer to base64 data URL
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      
      try {
        const uploadResult = await uploadFromDataUrl(dataUrl);
        storedUrl = uploadResult.secure_url;
        console.log('✅ File uploaded to Cloudinary:', storedUrl);
      } catch (uploadErr) {
        console.error('❌ Cloudinary upload error:', uploadErr);
        throw new Error(`Failed to upload image: ${uploadErr.message}`);
      }
    } 
    // Handle URL-based (backward compatibility)
    else if (req.body.proofDataUrl) {
      const uploadResult = await uploadFromDataUrl(req.body.proofDataUrl);
      storedUrl = uploadResult.secure_url;
    } else {
      storedUrl = req.body.proofUrl;
    }

    user.verificationStatus = 'pending';
    user.verificationProofUrl = storedUrl;
    user.verificationDraw = drawId;
    await user.save();

    console.log('✅ Verification submitted for user:', user._id);
    console.log('   Status: pending');
    console.log('   Proof URL:', storedUrl);

    res.json({ user, message: 'Proof uploaded successfully! Awaiting admin approval.' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create draw (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { month, prizePool, jackpot } = req.body;
    if (!month || !prizePool || !jackpot) {
      return res.status(400).json({ message: 'month, prizePool and jackpot are required' });
    }
    const draw = new Draw({ ...req.body, numbers: [], status: 'upcoming' });
    await draw.save();
    res.status(201).json(draw);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update draw (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const draw = await Draw.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    res.json(draw);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete draw (admin only) — FIX: was missing entirely
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const draw = await Draw.findByIdAndDelete(req.params.id);
    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    res.json({ message: 'Draw deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Run draw (admin only)
router.post('/:id/run', auth, adminAuth, async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    if (draw.status === 'completed') {
      return res.status(400).json({ message: 'Draw already completed' });
    }

    // Generate 5 unique numbers between 1-45
    const numbersSet = new Set();
    while (numbersSet.size < 5) {
      numbersSet.add(Math.floor(Math.random() * 45) + 1);
    }
    const numbers = Array.from(numbersSet);

    const winners5 = Math.random() > 0.92 ? 1 : 0;
    const winners4 = Math.floor(Math.random() * 5);
    const winners3 = Math.floor(Math.random() * 15) + 3;

    draw.numbers = numbers;
    draw.status = 'completed';
    draw.winners5 = winners5;
    draw.winners4 = winners4;
    draw.winners3 = winners3;
    await draw.save();

    res.json(draw);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
