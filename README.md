# GolfGives — Fixed & Functional

A golf charity lottery platform. Players enter scores as their draw numbers; a portion of winnings goes to their chosen charity.

---

## 🐛 Bugs Fixed

### Backend
| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `.env` | Missing entirely from project | Added with all secrets (Stripe, SendGrid, Twilio, Cloudinary) |
| 2 | `package.json` | Missing `stripe`, `nodemailer`, `multer`, `cloudinary`, `nodemon` | Added all required dependencies |
| 3 | `routes/draws.js` | `DELETE /draws/:id` route was missing entirely | Added delete route |
| 4 | `models/Draw.js` | `numbers: [Number]` broke when seed passed `null` | Changed to `numbers: { type: [Number], default: [] }` |
| 5 | `seed.js` | `numbers: null` on upcoming draw violated schema | Changed to `numbers: []` |
| 6 | `index.js` | No `/api/payments` route mounted | Added payments route |
| 7 | `routes/auth.js` | No input validation on register/login | Added checks for required fields |
| 8 | `middleware/auth.js` | `req.user` included password field | Added `.select('-password')` |
| 9 | `routes/auth.js` | `process.env.JWT_SECRET \|\| 'secret'` fallback insecure | Use centralized config with strict validation |
| 10 | `index.js` | Hardcoded CORS origins & MongoDB fallback | Use centralized config with `getFrontendUrl()` & `getMongoDBUri()` |
| 11 | `routes/payments.js` | `process.env.FRONTEND_URL \|\| 'http://localhost:3000'` scattered throughout | Use `getFrontendUrl()` from config |
| 12 | `routes/payments.js` | No validation that required env vars exist at startup | Added `validateEnv()` call in index.js |
| 13 | `.env` files | Multiple `.env` files in backend & frontend, no root config | Created root `.env` + `.env.example` documentation |
| 14 | Frontend & Backend | No centralized way to manage configuration | Created `backend/utils/config.js` module |

### Frontend
| # | File | Bug | Fix |
|---|------|-----|-----|
| 15  | `api.js` | `deleteDraw()` method missing — context called it but it didn't exist | Added `deleteDraw()` method |
| 16 | `context/AppContext.js` | `login()` and `signup()` called without `await` in Login/Signup — result was always a Promise (truthy), never an error object | Fixed at call sites |
| 17 | `context/AppContext.js` | `totalPrizePool` used in Admin but never computed or exported | Added computed value + exported it |
| 18 | `context/AppContext.js` | `setUsers` not exported but Admin destructured it | Added `setUsers` to context value |
| 19 | `pages/Login.js` | `result = login(...)` without `await` — always succeeded | Added `await` |
| 20 | `pages/Login.js` | Demo admin login used `admin@golfgives.com` but seed creates `admin@example.com` | Fixed demo email |
| 21 | `pages/Signup.js` | `result = signup(...)` without `await` | Added `await` |
| 22 | `pages/Signup.js` | `c.id` used in charity `<select>` — MongoDB returns `c._id` | Changed to `c._id` |
| 23 | `pages/Signup.js` | `Number(e.target.value)` on ObjectId string — corrupted the value | Removed `Number()` cast, kept as string |
| 24 | `pages/Dashboard.js` | Same `c.id` / `Number()` bugs in charity selector | Fixed to use `c._id` strings |
| 25 | `pages/Admin.js` | Destructured `setUsers` and `addCharity` from context — neither exist (context exports `createCharity`) | Fixed destructuring; `addCharity` → `createCharity` |
| 26 | `pages/Admin.js` | `totalPrizePool` was `undefined` | Now comes from context |
| 27 | `pages/Admin.js` | Admin never loaded users from API on mount | Added `useEffect` calling `loadUsers()` |

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (URI in .env) or local MongoDB

### 1. Backend

```bash
cd backend
npm install
node seed.js        # Seed the database (run once)
npm run dev         # Start with nodemon (development)
# or
npm start           # Start without nodemon (production)
```

Backend runs on **http://localhost:5000**

### 2. Frontend

```bash
cd golfcharity
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Player | sarah@example.com      | password123 |
| Player | james@example.com      | password123 |
| Admin  | admin@example.com      | admin123    |

---

## 🏗 Project Structure

```
golfgives/
├── backend/
│   ├── .env                  ← All secrets (Stripe, SendGrid, etc.)
│   ├── index.js              ← Express server entry point
│   ├── seed.js               ← Database seeder
│   ├── middleware/
│   │   └── auth.js           ← JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Charity.js
│   │   └── Draw.js
│   └── routes/
│       ├── auth.js           ← /api/auth/*
│       ├── charities.js      ← /api/charities/*
│       ├── draws.js          ← /api/draws/*
│       ├── admin.js          ← /api/admin/*
│       └── payments.js       ← /api/payments/* (Stripe)
└── golfcharity/
    ├── .env                  ← REACT_APP_API_URL
    ├── src/
    │   ├── api.js            ← All API calls
    │   ├── App.js            ← Routes
    │   ├── context/
    │   │   └── AppContext.js ← Global state
    │   ├── components/
    │   │   ├── Navbar.js/css
    │   │   ├── Footer.js/css
    │   │   └── Notification.js
    │   └── pages/
    │       ├── Home, Login, Signup, Dashboard
    │       ├── Draws, Charities, HowItWorks
    │       └── Admin
    └── public/
```

---

## 💳 Stripe Integration

Payments route is at `/api/payments`. The signup flow creates an account and then you can redirect to Stripe Checkout. The webhook at `/api/payments/webhook` updates subscription status automatically.

For local webhook testing use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## ⚙️ Configuration Management

### Environment Variables Structure

This project now has **centralized configuration**:

```
golfgives/
├── .env                    ← Root config (all variables)
├── .env.example            ← Template for documentation
├── backend/
│   ├── .env                ← Backend-specific + shared vars
│   └── utils/config.js     ← Config validation & getters
└── golfcharity/
    └── .env                ← Frontend-specific vars (REACT_APP_*)
```

### Setup Configuration

**1. Copy the template:**
```bash
cp .env.example backend/.env
cp .env.example golfcharity/.env
```

**2. Fill in your secrets in both `.env` files:**
```bash
# Core (required)
JWT_SECRET=your_secret_here_32_chars_min
MONGODB_URI=your_mongodb_connection_uri

# Services (optional but recommended)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
SENDGRID_API_KEY=SG...
```

### Environment Variable Validation

The backend validates all **required** env vars on startup:
- `JWT_SECRET` — MUST be 32+ chars (not a weak fallback)
- `MONGODB_URI` — MUST be a valid MongoDB connection string
- `PORT` — Defaults to 5000

If any required var is missing, the server will **exit with error 1** and list the missing vars.

### Config Utility (backend/utils/config.js)

All backend routes import from `utils/config.js`:

```javascript
const { 
  validateEnv,        // Run at startup (index.js)
  getJWTSecret,       // Routes & middleware
  getMongoDBUri,      // Database setup
  getPort,            // Server startup
  getFrontendUrl,     // CORS & redirects
  getStripeKeys       // Payment routes
} = require('./utils/config');
```

This ensures **no hardcoded fallbacks** and **centralized validation**.

### Root package.json Scripts

Use the root `package.json` to manage both apps:

```bash
npm install                 # Install all dependencies (root + both apps)
npm run start:all          # Start backend & frontend together
npm run dev:all            # Start both in development mode
npm run seed               # Run database seeder
npm run build              # Build frontend
npm run env:check          # Verify .env files exist
```

---

## 🐛 Summary of Ambiguities Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Missing .env** | No frontend/backend configuration | Created `.env` in root, backend, frontend + `.env.example` |
| **Inconsistent env handling** | Hardcoded fallbacks scattered (`\|\| 'secret'`, `\|\| 'http://localhost:3000'`) | Centralized `config.js` with strict validation |
| **JWT secret insecure** | `process.env.JWT_SECRET \|\| 'secret'` in 3 places | Use `getJWTSecret()` from config (no fallback allowed) |
| **Frontend URL hardcoded** | `http://localhost:3000` in payments, CORS config | Use `getFrontendUrl()` from environment |
| **No config documentation** | Trial & error to find what vars are needed | `.env.example` with all vars documented |
| **No root setup** | Had to cd into each folder separately | Root `package.json` with `npm run start:all`, `npm run dev:all` |
| **Environment not validated** | App would crash mysteriously if vars missing at runtime | Startup check lists all missing required vars |

