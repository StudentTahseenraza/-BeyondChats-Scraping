const logger = require('../utils/logger');
const config = require('../config/config');
const GeminiService = require('./gemini-service');
const OllamaService = require('./ollama-service');
const OpenRouterService = require('./openrouter-service'); // Add this

class AIServiceFactory {
  static createService() {
    const modelType = config.ai.model.toLowerCase();
    
    logger.info(`Creating AI service for model: ${modelType}`);
    
    switch (modelType) {
      case 'gemini':
        try {
          return new GeminiService();
        } catch (error) {
          logger.error('Failed to create Gemini service:', error.message);
          // Fallback to OpenRouter if available
          if (process.env.OPENROUTER_API_KEY) {
            logger.info('Falling back to OpenRouter service');
            return new OpenRouterService();
          }
          throw new Error(`Gemini service creation failed: ${error.message}`);
        }
        
      case 'ollama':
        try {
          return new OllamaService();
        } catch (error) {
          logger.error('Failed to create Ollama service:', error.message);
          throw new Error(`Ollama service creation failed: ${error.message}`);
        }
        
      case 'openrouter':  // Add OpenRouter case
        try {
          return new OpenRouterService();
        } catch (error) {
          logger.error('Failed to create OpenRouter service:', error.message);
          throw new Error(`OpenRouter service creation failed: ${error.message}`);
        }
        
      default:
        // Try OpenRouter as default fallback if credentials exist
        if (process.env.OPENROUTER_API_KEY) {
          logger.info('Defaulting to OpenRouter service');
          return new OpenRouterService();
        }
        
        // If nothing works, try to use whatever is available
        try {
          if (process.env.GEMINI_API_KEY) {
            return new GeminiService();
          } else if (process.env.OPENROUTER_API_KEY) {
            return new OpenRouterService();
          } else {
            throw new Error('No AI API credentials found');
          }
        } catch (error) {
          throw new Error(`No AI service available. Configure GEMINI_API_KEY or OPENROUTER_API_KEY`);
        }
    }
  }

  static async testAllConnections() {
    const results = {
      gemini: false,
      ollama: false,
      openrouter: false, // Add OpenRouter
    };
    
    logger.info('Testing all AI model connections...');
    
    // Test Gemini
    try {
      const geminiService = new GeminiService();
      results.gemini = await geminiService.testConnection();
    } catch (error) {
      logger.warn('Gemini test skipped:', error.message);
    }
    
    // Test Ollama
    try {
      const ollamaService = new OllamaService();
      results.ollama = await ollamaService.testConnection();
    } catch (error) {
      logger.warn('Ollama test skipped:', error.message);
    }
    
    // Test OpenRouter
    try {
      const openRouterService = new OpenRouterService();
      results.openrouter = await openRouterService.testConnection();
    } catch (error) {
      logger.warn('OpenRouter test skipped:', error.message);
    }
    
    logger.info('AI Model Test Results:');
    logger.info(`- Gemini: ${results.gemini ? '✅ Available' : '❌ Not available'}`);
    logger.info(`- Ollama: ${results.ollama ? '✅ Available' : '❌ Not available'}`);
    logger.info(`- OpenRouter: ${results.openrouter ? '✅ Available' : '❌ Not available'}`);
    
    // Recommend best available
    const availableModels = Object.entries(results)
      .filter(([_, available]) => available)
      .map(([model]) => model);
    
    if (availableModels.length > 0) {
      logger.info(`\n✅ Available models: ${availableModels.join(', ')}`);
      logger.info(`Set AI_MODEL=${availableModels[0]} in .env to use it`);
    } else {
      logger.error('\n❌ No AI models available. Please configure:');
      logger.info('1. Get free OpenRouter key: https://openrouter.ai');
      logger.info('2. Add OPENROUTER_API_KEY to .env file');
    }
    
    return results;
  }
}

module.exports = AIServiceFactory;
