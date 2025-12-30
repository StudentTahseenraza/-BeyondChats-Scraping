const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// AI Enhancement Routes
router.post('/enhance/:id', aiController.enhanceArticle);          // Enhance single article
router.post('/enhance-all', aiController.enhanceAllArticles);      // Enhance all unprocessed articles
router.get('/status', aiController.getEnhancementStatus);          // Get enhancement status
router.post('/test-connection', aiController.testAIConnection);    // Test AI connection

module.exports = router;
