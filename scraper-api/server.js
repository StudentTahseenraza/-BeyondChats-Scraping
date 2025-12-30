require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/database');
const aiRoutes = require('./src/routes/ai.routes');
const articleRoutes = require('./src/routes/article.routes');


// Import middlewares
const errorHandler = require('./src/middlewares/errorHandler');
const notFound = require('./src/middlewares/notFound');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 BeyondChats Article Scraping API',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      scrape: '/api/articles/scrape',
      status: '/api/articles/status',
      documentation: 'Coming soon...',
    },
  });
});

// API Routes
app.use('/api/articles', articleRoutes);
app.use('/api/ai', aiRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err.message);
  process.exit(1);
});