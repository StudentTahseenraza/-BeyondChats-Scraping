const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const config = require('../config/config');

class ContentScraperService {
  constructor() {
    this.client = axios.create({
      timeout: config.script.timeout,
      headers: {
        'User-Agent': config.google.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });
  }

  async delay(ms = config.script.requestDelay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeArticle(url) {
    try {
      logger.info(`Scraping article: ${url}`);

      // Add delay to avoid rate limiting
      await this.delay(2000 + Math.random() * 2000); // 2-4 second delay

      // Try with different approaches for different sites
      let response;
      let $;

      try {
        // First try with standard headers
        response = await this.client.get(url);
        $ = cheerio.load(response.data);
      } catch (error) {
        logger.warn(`First attempt failed for ${url}: ${error.message}`);

        // Try with different User-Agent
        const altClient = axios.create({
          timeout: config.script.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        response = await altClient.get(url);
        $ = cheerio.load(response.data);
      }

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .sidebar, .ad, .ads, .advertisement, iframe, .comments, .related-posts, .social-share, .newsletter, .popup').remove();

      // Try different selectors for main content
      const contentSelectors = [
        'article',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.blog-content',
        '.content',
        'main',
        '.main-content',
        '[role="main"]',
        '.post',
        '.blog-post',
        '.story',
        '.story-body',
        '.article-body',
        '.post-body',
      ];

      let mainContent = '';
      let selectedSelector = '';

      for (const selector of contentSelectors) {
        if ($(selector).length) {
          mainContent = $(selector).html();
          selectedSelector = selector;
          break;
        }
      }

      // If no specific selector found, try to find the largest text block
      if (!mainContent) {
        const bodyText = $('body').text();
        const words = bodyText.split(/\s+/).length;

        if (words > 200) { // If body has substantial content
          mainContent = $('body').html();
          selectedSelector = 'body';
        }
      }

      if (!mainContent) {
        throw new Error('Could not find article content');
      }

      // Parse the content
      const $content = cheerio.load(mainContent);

      // Remove more unwanted elements from within the content
      $content('script, style, nav, header, footer, aside, .sidebar, .ad, .ads, .advertisement, iframe, .social-share, .comments, .related-posts, .newsletter, .popup').remove();

      // Get text content
      let textContent = $content('body').text();

      // Clean up the text
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      // Check if content is substantial
      if (textContent.length < config.script.minArticleLength) {
        throw new Error(`Content too short: ${textContent.length} characters`);
      }

      // Extract title
      const title = $('title').text() ||
        $('h1').first().text() ||
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        '';

      // Extract description
      const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        '';

      logger.debug(`Scraped using selector: ${selectedSelector}`);
      logger.debug(`Title: ${title.substring(0, 100)}...`);
      logger.debug(`Content length: ${textContent.length} characters`);

      return {
        url,
        title: title.trim().substring(0, 200),
        description: description.trim().substring(0, 300),
        content: textContent,
        scrapedAt: new Date().toISOString(),
        success: true,
      };

    } catch (error) {
      logger.error(`Failed to scrape ${url}: ${error.message}`);

      // Return failure but DO NOT provide mock data
      return {
        url,
        title: '',
        description: '',
        content: '',
        scrapedAt: new Date().toISOString(),
        success: false,
        error: error.message,
      };
    }
  }

  async scrapeMultipleArticles(urls) {
    try {
      logger.info(`Scraping ${urls.length} articles...`);

      const results = [];
      for (const url of urls) {
        const result = await this.scrapeArticle(url);
        results.push(result);

        // Add significant delay between requests to avoid blocking
        if (url !== urls[urls.length - 1]) {
          await this.delay(3000 + Math.random() * 3000); // 3-6 second delay
        }
      }

      // Only return successful scrapes with substantial content
      const successfulScrapes = results.filter(r =>
        r.success &&
        r.content.length >= config.script.minArticleLength
      );

      logger.info(`Successfully scraped ${successfulScrapes.length}/${urls.length} articles`);

      if (successfulScrapes.length === 0) {
        logger.warn('No articles were successfully scraped. The AI enhancement will proceed without competitor analysis.');
      }

      return successfulScrapes;

    } catch (error) {
      logger.error('Error in scrapeMultipleArticles:', error.message);
      return [];
    }
  }

  async validateContent(content, minLength = config.script.minArticleLength) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const cleanContent = content.trim();

    // Check minimum length
    if (cleanContent.length < minLength) {
      logger.warn(`Content too short: ${cleanContent.length} characters (minimum: ${minLength})`);
      return false;
    }

    // Check for common error indicators
    const errorIndicators = [
      'access denied',
      '404 not found',
      'page not found',
      'forbidden',
      'blocked',
      'captcha',
      'robot check',
    ];

    const lowerContent = cleanContent.toLowerCase();
    for (const indicator of errorIndicators) {
      if (lowerContent.includes(indicator)) {
        logger.warn(`Content contains error indicator: "${indicator}"`);
        return false;
      }
    }

    return true;
  }
}

module.exports = new ContentScraperService();