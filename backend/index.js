const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { validateEnv, getMongoDBUri, getPort, getFrontendUrl } = require('./utils/config');

dotenv.config();

// Validate environment variables on startup
validateEnv();

const app = express();

// Middleware - CORS with dynamic frontend URL
app.use(cors({
  origin: [
    'https://golfgives-1.onrender.com',  // your frontend URL
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(getMongoDBUri())
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = getPort();
app.listen(PORT, () => {
  console.log(`\n🌐 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Base: http://localhost:${PORT}/api`);
  console.log(`🎨 Frontend: ${getFrontendUrl()}\n`);
});
