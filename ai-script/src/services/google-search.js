const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');

class GoogleSearchService {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
    
    if (!this.apiKey || !this.searchEngineId) {
      logger.warn('Google API credentials not configured. Some features may not work.');
    }
  }

  async searchArticleTitle(articleTitle) {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        logger.error('Google API credentials missing. Please add GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID to .env file');
        return [];
      }
      
      logger.info(`Searching via Google API for: "${articleTitle}"`);
      
      const searchQuery = `${articleTitle} site:.com OR site:.org "article" OR "blog" -site:beyondchats.com`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          num: config.google.maxResults,
          dateRestrict: 'y1', // Last year
          safe: 'active',
          siteSearch: '', // Don't restrict to specific sites
          siteSearchFilter: 'e' // Exclude similar pages
        },
        timeout: 10000,
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const results = response.data.items
          .map((item, index) => ({
            url: item.link,
            title: item.title || `Result ${index + 1}`,
            snippet: item.snippet || '',
            position: index + 1,
          }))
          .filter(item => {
            // Filter out non-article pages
            const url = item.url.toLowerCase();
            return !url.includes('youtube.com') && 
                   !url.includes('wikipedia.org') &&
                   !url.includes('beyondchats.com') &&
                   !url.includes('pdf') &&
                   !url.includes('.gov');
          })
          .slice(0, config.google.competitorArticles);
        
        logger.info(`Google API found ${results.length} real competitor articles`);
        return results;
      } else {
        logger.warn('Google API returned no results');
        return [];
      }
      
    } catch (error) {
      logger.error('Google API search failed:', error.message);
      
      // If API fails, try alternative approach - use DuckDuckGo HTML
      return await this.alternativeSearch(articleTitle);
    }
  }

  async alternativeSearch(articleTitle) {
    try {
      logger.info('Trying alternative search method...');
      
      // Use DuckDuckGo as fallback (less likely to block)
      const duckDuckGoUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(articleTitle + ' article blog')}`;
      
      const response = await axios.get(duckDuckGoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      // Parse HTML response
      const cheerio = require('cheerio');
      const $ = cheerio.load(response.data);
      
      const results = [];
      $('.result__title').each((i, element) => {
        if (results.length >= config.google.competitorArticles) return false;
        
        const link = $(element).find('a.result__url');
        const url = link.attr('href');
        const title = $(element).find('.result__title').text().trim();
        
        if (url && !url.includes('duckduckgo.com') && !url.includes('beyondchats.com')) {
          // Extract actual URL from DuckDuckGo redirect
          const match = url.match(/uddg=([^&]+)/);
          const actualUrl = match ? decodeURIComponent(match[1]) : url;
          
          results.push({
            url: actualUrl,
            title: title || 'Search Result',
            snippet: '',
            position: i + 1
          });
        }
      });
      
      logger.info(`Alternative search found ${results.length} results`);
      return results;
      
    } catch (error) {
      logger.error('Alternative search also failed:', error.message);
      return [];
    }
  }

  // Remove the old init and close methods since we don't need Puppeteer anymore
  async init() {
    logger.info('Google Search service initialized (API-based)');
    return true;
  }

  async close() {
    logger.info('Google Search service closed');
    return true;
  }
}

module.exports = GoogleSearchService;
