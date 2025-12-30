require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await connectDB();
    
    // Get the Article model
    const Article = require('../models/Article');
    
    // Delete all articles
    const result = await Article.deleteMany({});
    
    console.log(`✅ Cleanup completed! Deleted ${result.deletedCount} articles`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();