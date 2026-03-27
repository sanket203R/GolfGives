const mongoose = require('mongoose');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Draw = require('./models/Draw');
require('dotenv').config();

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/golfcharity';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Charity.deleteMany();
    await Draw.deleteMany();
    console.log('Cleared existing data');

    // Seed charities
    const charities = await Charity.insertMany([
      { name: 'Green Fairways Foundation', category: 'Environment', description: 'Planting trees on former golf courses, restoring habitats and creating green corridors across the country.', raised: 124500, goal: 200000, supporters: 1240, featured: true, image: '🌳', color: '#2d6a4f' },
      { name: 'Junior Golfers Academy', category: 'Youth', description: 'Providing free golf training and equipment to underprivileged youth, building confidence through sport.', raised: 87300, goal: 150000, supporters: 873, featured: true, image: '⛳', color: '#1d3557' },
      { name: 'Veterans on the Green', category: 'Veterans', description: 'Golf therapy programs for veterans dealing with PTSD and physical rehabilitation needs.', raised: 63200, goal: 100000, supporters: 632, featured: false, image: '🎖️', color: '#6b2737' },
      { name: 'Cancer Research Golf Fund', category: 'Health', description: 'Funding breakthrough cancer research through the collective power of the golf community.', raised: 210000, goal: 500000, supporters: 2100, featured: true, image: '🎗️', color: '#7b2d8b' },
      { name: 'Food Banks Alliance', category: 'Hunger', description: 'Every swing feeds a family. We distribute meals to food-insecure communities nationwide.', raised: 156000, goal: 300000, supporters: 1560, featured: false, image: '🍽️', color: '#e76f51' },
      { name: 'Mental Health Matters', category: 'Health', description: 'Breaking the stigma around mental health in sports communities and beyond.', raised: 44800, goal: 80000, supporters: 448, featured: false, image: '💚', color: '#457b9d' },
    ]);
    console.log(`Seeded ${charities.length} charities`);

    // Seed draws — FIX: no null numbers, use empty array for upcoming
    const draws = await Draw.insertMany([
      { month: 'December 2024', status: 'completed', numbers: [12, 7, 34, 19, 41], prizePool: 45000, winners5: 1, winners4: 3, winners3: 12, jackpot: 18000 },
      { month: 'November 2024', status: 'completed', numbers: [5, 22, 8, 37, 14],  prizePool: 38500, winners5: 0, winners4: 2, winners3: 9,  jackpot: 15400 },
      { month: 'October 2024',  status: 'completed', numbers: [3, 18, 29, 40, 11], prizePool: 35000, winners5: 0, winners4: 1, winners3: 7,  jackpot: 14000 },
      { month: 'January 2025',  status: 'upcoming',  numbers: [],                  prizePool: 52000, winners5: 0, winners4: 0, winners3: 0,  jackpot: 20800 },
    ]);
    console.log(`Seeded ${draws.length} draws`);

    // Seed users — passwords will be hashed by pre-save hook
    // FIX: charity refs use ObjectId from created charities
    const users = [
      {
        name: 'Sarah Mitchell', email: 'sarah@example.com', password: 'password123',
        role: 'subscriber', subscription: 'active', plan: 'yearly',
        charity: charities[0]._id, charityPercent: 15,
        scores: [{ value: 22, date: new Date('2025-01-10') }, { value: 18, date: new Date('2025-01-03') }, { value: 34, date: new Date('2024-12-28') }, { value: 11, date: new Date('2024-12-20') }, { value: 29, date: new Date('2024-12-15') }],
        winnings: 1200, joined: new Date('2024-06-15')
      },
      {
        name: "James O'Brien", email: 'james@example.com', password: 'password123',
        role: 'subscriber', subscription: 'active', plan: 'monthly',
        charity: charities[1]._id, charityPercent: 10,
        scores: [{ value: 31, date: new Date('2025-01-09') }, { value: 9, date: new Date('2024-12-30') }, { value: 43, date: new Date('2024-12-22') }],
        winnings: 0, joined: new Date('2024-11-01')
      },
      {
        name: 'Emma Thornton', email: 'emma@example.com', password: 'password123',
        role: 'subscriber', subscription: 'expired', plan: 'monthly',
        charity: charities[3]._id, charityPercent: 20,
        scores: [{ value: 5, date: new Date('2024-11-15') }],
        winnings: 350, joined: new Date('2024-03-20')
      },
      {
        name: 'Admin User', email: 'admin@example.com', password: 'admin123',
        role: 'admin', subscription: 'active', plan: 'yearly'
      },
    ];

    // Save one by one so the pre-save hook hashes passwords
    for (const u of users) {
      await new User(u).save();
    }
    console.log(`Seeded ${users.length} users`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo credentials:');
    console.log('  Player:  sarah@example.com  / password123');
    console.log('  Player:  james@example.com  / password123');
    console.log('  Admin:   admin@example.com  / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
