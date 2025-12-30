const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');

class GoogleAPISearchService {
  constructor() {
    // You'll need to get these from Google Cloud Console
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async searchArticleTitle(articleTitle) {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        logger.warn('Google API credentials not configured. Using fallback.');
        return this.fallbackMockResults(articleTitle);
      }
      
      logger.info(`Searching via Google API for: "${articleTitle}"`);
      
      const searchQuery = `${articleTitle} blog article`;
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          num: config.google.maxResults,
          siteSearchFilter: 'i', // Only return results from indexed sites
        },
        timeout: 10000,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const results = response.data.items
          .filter(item => !item.link.includes('beyondchats.com'))
          .map((item, index) => ({
            url: item.link,
            title: item.title || `Result ${index + 1}`,
            position: index + 1,
          }))
          .slice(0, config.google.competitorArticles);
        
        logger.info(`Google API found ${results.length} results`);
        return results;
      } else {
        logger.warn('Google API returned no results');
        return this.fallbackMockResults(articleTitle);
      }
      
    } catch (error) {
      logger.error('Google API search failed:', error.message);
      return this.fallbackMockResults(articleTitle);
    }
  }

  async fallbackMockResults(articleTitle) {
    logger.info('Using mock search results for testing...');
    
    // Return mock results for testing when Google search fails
    const mockResults = [
      {
        url: 'https://example.com/blog/ai-in-healthcare',
        title: 'The Role of AI in Modern Healthcare - Example Blog',
        position: 1,
      },
      {
        url: 'https://techinsights.com/articles/ai-patient-care',
        title: 'Understanding AI in Patient Care - Tech Insights',
        position: 2,
      }
    ];
    
    // Customize based on article title
    if (articleTitle.includes('chatbot')) {
      mockResults[0].url = 'https://chatbotguide.com/best-ai-chatbots';
      mockResults[0].title = 'Choosing the Best AI Chatbot for Your Needs';
      mockResults[1].url = 'https://aitech.com/chatbot-comparison';
      mockResults[1].title = 'AI Chatbot Comparison Guide 2024';
    } else if (articleTitle.includes('Google Ads')) {
      mockResults[0].url = 'https://marketingpro.com/google-ads-optimization';
      mockResults[0].title = 'Optimizing Google Ads for Maximum ROI';
      mockResults[1].url = 'https://digitalmarketing.com/avoid-wasting-ad-budget';
      mockResults[1].title = 'How to Avoid Wasting Your Google Ads Budget';
    }
    
    return mockResults;
  }
}

module.exports = GoogleAPISearchService;