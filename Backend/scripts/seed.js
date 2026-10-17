require('dotenv').config();
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const logger = require('../src/utils/logger');

const seedDatabase = async () => {
  try {
    logger.info('Connecting to database for seeding...');
    await connectDB();

    logger.info('Clearing existing demo users and tasks...');
    await User.deleteMany({
      email: { $in: ['demo@taskflow.com', 'sarah@taskflow.com', 'demo@iptechie.com', 'sarah@iptechie.com'] }
    });

    logger.info('Creating demo users with hashed credentials...');
    const user1 = await User.create({
      name: 'Alex Demo',
      email: 'demo@taskflow.com',
      password: 'Password123!' // Automatically hashed by User pre-save hook
    });

    const user2 = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@taskflow.com',
      password: 'Password123!'
    });

    logger.info('Seeding tasks with various statuses and priorities...');
    const tasks = [
      {
        title: 'Review MERN Architecture & Design Patterns',
        description: 'Audit Express middleware pipeline, Mongoose schema indexes, and error boundaries.',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        userId: user1._id
      },
      {
        title: 'Integrate Transactional Email Service',
        description: 'Configure API key placeholder, welcome email templates, and dispatch triggers.',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        userId: user1._id
      },
      {
        title: 'Build React Task Dashboard & Stat Cards',
        description: 'Design responsive metrics overview, filter bars, status pills, and sort controls.',
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        userId: user1._id
      },
      {
        title: 'Implement Multi-Criteria Filter and Search',
        description: 'Support real-time debounced title search combined with status and priority tags.',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        userId: user1._id
      },
      {
        title: 'Optimize Database Query Indexes',
        description: 'Add compound indexes on { userId: 1, createdAt: -1 } and { userId: 1, status: 1 }.',
        status: 'completed',
        priority: 'low',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
        userId: user1._id
      },
      {
        title: 'Write Comprehensive Unit & Integration Tests',
        description: 'Cover auth register/login, task CRUD, and cross-user authorization security checks.',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        userId: user1._id
      },
      // Tasks for User 2 (to test authorization boundary)
      {
        title: "Sarah's Private Infrastructure Plan",
        description: 'Confidential system architecture document. Should not be visible to User 1.',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        userId: user2._id
      }
    ];

    await Task.insertMany(tasks);

    logger.success('Database seeded successfully!');
    console.log('\n======================================================');
    console.log('🎉 SEED CREDENTIALS READY FOR TESTING');
    console.log('======================================================');
    console.log('Primary Test Account:');
    console.log('  Email:    demo@taskflow.com');
    console.log('  Password: Password123!');
    console.log('Secondary Test Account (for security isolation testing):');
    console.log('  Email:    sarah@taskflow.com');
    console.log('  Password: Password123!');
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();
