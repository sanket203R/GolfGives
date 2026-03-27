# 🚀 Quick Start Guide for GolfGives

## Step 1: Install all dependencies

```bash
npm install
```

This installs dependencies for root, backend, and golfcharity at once.

## Step 2: Configure environment variables

**Copy the template:**
```bash
# Windows
copy .env.example backend\.env
copy .env.example golfcharity\.env

# Mac/Linux
cp .env.example backend/.env
cp .env.example golfcharity/.env
```

**Edit both `.env` files and add your secrets:**

### Required (both files):
```env
JWT_SECRET=your_strong_secret_key_here_minimum_32_chars
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/golf_charity
```

### Backend only:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend only:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Optional (payments, email, images):
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SENDGRID_API_KEY=SG...
CLOUDINARY_CLOUD_NAME=your_name
```

## Step 3: Seed the database

```bash
npm run seed
```

This creates demo users, charities, and draws.

## Step 4: Start the app

### Option A: Both apps together
```bash
npm run start:all
```

### Option B: In separate terminals (better for development)

Terminal 1 (Backend on port 5000):
```bash
npm run dev:backend
```

Terminal 2 (Frontend on port 3000):
```bash
npm run dev:frontend
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Player | sarah@example.com | password123 |
| Player | james@example.com | password123 |
| Admin | admin@example.com | admin123 |

---

## 📋 What Was Fixed

✅ **Configuration**: Created centralized `.env` files with documentation  
✅ **Env validation**: Backend validates required vars on startup (no weak fallbacks)  
✅ **Frontend API**: Added proper `REACT_APP_API_URL` configuration  
✅ **JWT security**: Removed `|| 'secret'` fallback (now requires real secret)  
✅ **Stripe webhooks**: Added `STRIPE_WEBHOOK_SECRET` to `.env`  
✅ **CORS**: Uses `FRONTEND_URL` from env (not hardcoded)  
✅ **Root setup**: Created root `package.json` with unified scripts  
✅ **Documentation**: Added `.env.example` explaining all variables  

---

## 🐛 If Something Goes Wrong

### Backend won't start
```bash
cd backend
node index.js
# Look for error about missing env vars
# Make sure JWT_SECRET and MONGODB_URI are filled in
```

### Can't connect to MongoDB
- Check `MONGODB_URI` is correct in `backend/.env`
- Make sure MongoDB cluster allows your IP

### Frontend won't load
- Check `REACT_APP_API_URL=http://localhost:5000/api` in `golfcharity/.env`
- Make sure backend is running on port 5000

### Stripe/SendGrid not working
- These are optional for development
- You can test without them

---

## 📁 File Structure Reminder

```
golfgives/
├── .env                    ← Add your secrets here
├── .env.example           ← Template (do not edit)
├── package.json           ← Root build commands
├── backend/
│   ├── .env               ← Copy from root template
│   ├── utils/config.js    ← Env validation & getters
│   └── ...
└── golfcharity/
    ├── .env               ← Copy from root template (REACT_APP_*)
    └── ...
```

---

Happy golfing! ⛳
