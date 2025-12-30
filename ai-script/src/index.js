#!/usr/bin/env node

const ArticleProcessor = require('./services/processor');
const AIServiceFactory = require('./services/ai-service-factory');
const logger = require('./utils/logger');
const config = require('./config/config');

async function main() {
  try {
    logger.section('BEYONDCHATS AI AUTOMATION SCRIPT');
    logger.info('Starting Phase 2: AI Content Enhancement with FREE Models');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const processAll = args.includes('--process-all');
    const testMode = args.includes('--test');
    const testAllModels = args.includes('--test-all-models');
    const singleArticleId = args.find(arg => arg.startsWith('--article-id='))?.split('=')[1];
    const modelArg = args.find(arg => arg.startsWith('--model='))?.split('=')[1];
    
    // Determine which model to use
    const aiModel = modelArg || config.ai.model;
    logger.info(`Selected AI model: ${aiModel}`);
    
    if (testAllModels) {
      await testAllAIModels();
      return;
    }
    
    // Create processor instance with selected model
    const processor = new ArticleProcessor(aiModel);
    
    // Initialize services
    const initialized = await processor.initialize();
    if (!initialized) {
      logger.error('Failed to initialize services. Exiting.');
      process.exit(1);
    }
    
    // Execute based on arguments
    if (testMode) {
      await runTests(processor);
    } else if (singleArticleId) {
      await processSingleArticle(processor, singleArticleId);
    } else if (processAll || args.length === 0) {
      await processAllArticles(processor);
    } else {
      showHelp();
    }
    
  } catch (error) {
    logger.error('Fatal error in main process:', error);
    process.exit(1);
  }
}

async function testAllAIModels() {
  logger.section('TESTING ALL AI MODELS');
  
  const results = await AIServiceFactory.testAllConnections();
  
  const availableModels = Object.entries(results)
    .filter(([_, available]) => available)
    .map(([model]) => model);
  
  if (availableModels.length > 0) {
    logger.info(`\n✅ Available AI models: ${availableModels.join(', ')}`);
    logger.info(`You can use any of these by setting AI_MODEL in .env file`);
  } else {
    logger.error('\n❌ No AI models available. Please set up at least one:');
    logger.info('1. For Gemini: Get API key from https://makersuite.google.com/app/apikey');
    logger.info('2. For Ollama: Install from https://ollama.ai/download and run "ollama pull llama2"');
  }
}

async function runTests(processor) {
  logger.section('RUNNING TESTS');
  
  // Test 1: Backend API connection
  logger.info('Test 1: Backend API Connection...');
  const apiConnected = await processor.apiClient.testConnection();
  console.log(apiConnected ? '✅ PASSED' : '❌ FAILED');
  
  // Test 2: AI connection
  logger.info(`Test 2: ${processor.requestedModel.toUpperCase()} AI Connection...`);
  const aiConnected = await processor.aiService.testConnection();
  console.log(aiConnected ? '✅ PASSED' : '❌ FAILED');
  
  // Test 3: Get articles
  logger.info('Test 3: Fetching articles...');
  try {
    const articles = await processor.apiClient.getArticles();
    console.log(`✅ PASSED - Found ${articles.length} articles`);
  } catch (error) {
    console.log('❌ FAILED -', error.message);
  }
  
  logger.info('\nAll tests completed!');
}

async function processSingleArticle(processor, articleId) {
  logger.info(`Processing single article: ${articleId}`);
  
  const result = await processor.processSingleArticle(articleId);
  
  if (result.success) {
    logger.info('✅ Single article processing completed successfully');
    logger.info('Result:', result.data);
  } else {
    logger.error('❌ Single article processing failed');
    logger.error('Error:', result.error || result.message);
  }
}

async function processAllArticles(processor) {
  logger.info('Processing all available articles...');
  
  const report = await processor.processAllArticles();
  
  // Save report to file
  const fs = require('fs');
  const path = require('path');
  const reportDir = path.join(config.logging.logDir, 'reports');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportFile = path.join(reportDir, `report-${Date.now()}-${processor.requestedModel}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  
  logger.info(`Report saved to: ${reportFile}`);
  logger.info('🎉 Batch processing completed!');
}

function showHelp() {
  console.log(`
BeyondChats AI Automation Script - FREE AI Models Edition

Available AI Models:
  • Gemini (Google) - Free tier, requires API key
  • Ollama (Local) - Completely free, runs on your machine

Commands:
  npm start                    Process all articles with default model
  npm run process              Process all articles
  npm run test                 Run connection tests
  npm run single -- --article-id=<ID>  Process single article
  npm run gemini               Use Gemini model
  npm run ollama               Use Ollama model

Arguments:
  --process-all                Process all unprocessed articles
  --test                       Run tests only
  --test-all-models            Test all AI model connections
  --article-id=<ID>            Process specific article by ID
  --model=<model>              Use specific model (gemini/ollama)

Examples:
  # Use Gemini
  node src/index.js --model=gemini --process-all
  
  # Use Ollama
  node src/index.js --model=ollama --article-id=65a1b2c3d4e5f6a7b8c9d0e1
  
  # Test all available models
  node src/index.js --test-all-models

Configuration:
  Edit .env file to configure AI models
  Default model: AI_MODEL=gemini
  `);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});