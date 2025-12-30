const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.api.backendUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': config.google.userAgent,
      },
    });
  }

  async delay(ms = config.script.requestDelay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getArticles() {
    try {
      logger.info('Fetching articles from backend API...');
      
      // Get original articles that haven't been updated yet
      const response = await this.client.get('/articles', {
        params: {
          source: 'original',
          isUpdated: false,
          limit: config.script.maxArticles,
          sort: '-createdAt',
        },
      });

      if (response.data.success && response.data.data.length > 0) {
        logger.info(`Found ${response.data.data.length} articles to process`);
        return response.data.data;
      } else {
        logger.warn('No articles found for processing');
        return [];
      }
    } catch (error) {
      logger.error('Error fetching articles:', error.message);
      throw error;
    }
  }

  async getArticleById(id) {
    try {
      logger.debug(`Fetching article with ID: ${id}`);
      const response = await this.client.get(`/articles/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Article not found');
      }
    } catch (error) {
      logger.error(`Error fetching article ${id}:`, error.message);
      throw error;
    }
  }

  async updateArticle(id, updateData) {
    try {
      logger.info(`Updating article ${id}...`);
      
      const response = await this.client.put(`/articles/${id}`, {
        ...updateData,
        isUpdated: true,
        source: 'ai-updated',
        updatedAt: new Date().toISOString(),
      });

      if (response.data.success) {
        logger.info(`✅ Article ${id} updated successfully`);
        return response.data.data;
      } else {
        throw new Error('Update failed: ' + response.data.message);
      }
    } catch (error) {
      logger.error(`Error updating article ${id}:`, error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      logger.info('Testing backend API connection...');
      const response = await this.client.get('/health');
      
      if (response.data.status === 'OK') {
        logger.info('✅ Backend API is accessible');
        return true;
      } else {
        logger.error('Backend API returned unexpected response');
        return false;
      }
    } catch (error) {
      logger.error('Cannot connect to backend API:', error.message);
      return false;
    }
  }
}

module.exports = new ApiClient();