require('dotenv').config();

const config = {
  // API Configuration
  api: {
    backendUrl: process.env.BACKEND_API_URL || 'http://localhost:5000/api',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.TIMEOUT_MS) || 30000,
  },

  ai: {
    model: process.env.AI_MODEL || 'openrouter', // 'gemini', 'ollama', or 'openrouter'

    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      temperature: Number(process.env.GEMINI_TEMPERATURE ?? 0.7),
      maxTokens: Number(process.env.GEMINI_MAX_TOKENS ?? 2048),
    },

    // Ollama Configuration
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS) || 2000,
    },

    // OpenRouter Configuration (for AllenAI Olmo 3.1)
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'allenai/olmo-3.1-32b-think:free',
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 4000,
    },
  },

  // Google Search Configuration
  google: {
    searchUrl: process.env.GOOGLE_SEARCH_URL || 'https://www.google.com/search',
    apiKey: process.env.GOOGLE_API_KEY,
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxResults: parseInt(process.env.MAX_GOOGLE_RESULTS) || 5,
    competitorArticles: parseInt(process.env.COMPETITOR_ARTICLES_TO_FETCH) || 2,
  },

  // Script Configuration
  script: {
    maxArticles: parseInt(process.env.MAX_ARTICLES_TO_PROCESS) || 5,
    minArticleLength: parseInt(process.env.MIN_ARTICLE_LENGTH) || 500,
    maxArticleLength: parseInt(process.env.MAX_ARTICLE_LENGTH) || 5000,
    requestDelay: parseInt(process.env.REQUEST_DELAY_MS) || 2000,
    timeout: parseInt(process.env.TIMEOUT_MS) || 30000,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logDir: process.env.LOG_DIR || './logs',
  },

  // Validation
  validate: function () {
    const errors = [];

    // Check based on selected model
    if (this.ai.model === 'gemini' && !this.ai.gemini.apiKey) {
      errors.push('GEMINI_API_KEY is required when using Gemini model');
    }

    if (this.ai.model === 'openrouter' && !this.ai.openrouter.apiKey) {
      errors.push('OPENROUTER_API_KEY is required when using OpenRouter model');
    }

    if (!this.api.backendUrl) {
      errors.push('BACKEND_API_URL is required in .env file');
    }

    // If no AI credentials at all
    if (!this.ai.gemini.apiKey && !this.ai.openrouter.apiKey) {
      errors.push('At least one AI API key is required (GEMINI_API_KEY or OPENROUTER_API_KEY)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Validate configuration
const validation = config.validate();
if (!validation.isValid) {
  console.error('❌ Configuration errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

module.exports = config;