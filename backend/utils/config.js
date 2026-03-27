// Centralized environment variable configuration
// Ensures all required env vars are checked on startup

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'PORT',
];

const warningEnvVars = [
  'STRIPE_SECRET_KEY',
  'SENDGRID_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
];

// Validate required env vars on startup
function validateEnv() {
  const missing = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error(
      `❌ CRITICAL: Missing required environment variables:\n   ${missing.join('\n   ')}\n` +
      `   Please copy .env.example to .env and fill in the values.`
    );
    process.exit(1);
  }

  // Warn about optional but commonly used vars
  warningEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`⚠️  Optional: ${varName} not configured - some features may not work`);
    }
  });
}

// Get JWT secret (required, no fallback)
function getJWTSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return process.env.JWT_SECRET;
}

// Get MongoDB URI (required, no fallback)
function getMongoDBUri() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  return process.env.MONGODB_URI;
}

// Get port with safe default
function getPort() {
  return process.env.PORT || 5000;
}

// Get frontend URL for CORS and redirects
function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

// Get Stripe keys if available
function getStripeKeys() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || null,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
    available: !!(process.env.STRIPE_SECRET_KEY)
  };
}

module.exports = {
  validateEnv,
  getJWTSecret,
  getMongoDBUri,
  getPort,
  getFrontendUrl,
  getStripeKeys,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
