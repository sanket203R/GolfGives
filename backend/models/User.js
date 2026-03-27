const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },
  subscription: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'expired' },
  plan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
  charityPercent: { type: Number, default: 10, min: 10, max: 50 },
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  verificationProofUrl: { type: String, default: '' },
  scores: [{ value: { type: Number, min: 1, max: 45 }, date: { type: Date, default: Date.now } }],
  winnings: { type: Number, default: 0 },
  joined: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
