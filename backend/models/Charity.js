const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  raised: { type: Number, default: 0 },
  goal: { type: Number, required: true },
  supporters: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  image: { type: String, default: '🌳' },
  color: { type: String, default: '#2d6a4f' }
}, { timestamps: true });

module.exports = mongoose.model('Charity', charitySchema);
