const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema({
  month: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
  numbers: { type: [Number], default: [] },   // FIX: was typed array that broke with null
  prizePool: { type: Number, required: true },
  winners5: { type: Number, default: 0 },
  winners4: { type: Number, default: 0 },
  winners3: { type: Number, default: 0 },
  jackpot: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Draw', drawSchema);
