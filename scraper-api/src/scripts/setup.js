require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('✅ Database connected successfully');
    
    // Create indexes
    const Article = require('../models/Article');
    await Article.createIndexes();
    
    console.log('✅ Database indexes created');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();