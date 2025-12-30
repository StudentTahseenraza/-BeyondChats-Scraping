const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');

// Article scraping and CRUD routes
router.get('/scrape', articleController.scrapeArticles);
router.get('/status', articleController.getScrapingStatus);
router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);
router.post('/', articleController.createArticle);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.delete('/', articleController.deleteAllArticles);

module.exports = router;