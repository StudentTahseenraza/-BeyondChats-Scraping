require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
    },

    // Database configuration
    database: {
        mongoUri: process.env.MONGODB_URI || process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/beyondchats',
    },

    // Scraping configuration
    scraping: {
        baseUrl: process.env.BASE_URL || 'https://beyondchats.com/blogs/',
        limit: parseInt(process.env.SCRAPE_LIMIT) || 5,
        requestDelay: parseInt(process.env.REQUEST_DELAY_MS) || 2000,
    },

    // AI Script configuration (if using separate AI script)
    aiScript: {
        enabled: process.env.AI_SCRIPT_ENABLED === 'true',
        url: process.env.AI_SCRIPT_URL || 'http://localhost:6000',
        timeout: parseInt(process.env.AI_SCRIPT_TIMEOUT) || 300000, // 5 minutes
    },

    // Security
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    }
};

module.exports = config;
