const ollama = require('ollama');
const logger = require('../utils/logger');
const config = require('../config/config');

class OllamaService {
  constructor() {
    this.baseUrl = config.ai.ollama.baseUrl;
    this.model = config.ai.ollama.model;
    
    // Configure ollama library
    ollama.setConfig({
      host: this.baseUrl,
    });
    
    logger.info(`✅ Ollama service initialized with model: ${this.model}`);
    logger.info(`Ollama base URL: ${this.baseUrl}`);
  }

  async ensureModelExists() {
    try {
      logger.info(`Checking if model '${this.model}' exists locally...`);
      
      const models = await ollama.list();
      const modelExists = models.models.some(m => m.name.includes(this.model));
      
      if (!modelExists) {
        logger.warn(`Model '${this.model}' not found. Available models:`, models.models.map(m => m.name));
        logger.info(`You can pull the model with: ollama pull ${this.model}`);
        return false;
      }
      
      logger.info(`✅ Model '${this.model}' is available locally`);
      return true;
    } catch (error) {
      logger.error('Error checking Ollama models:', error.message);
      logger.info('Make sure Ollama is installed and running: https://ollama.ai/download');
      return false;
    }
  }

  async enhanceArticle(originalArticle, competitorArticles) {
    try {
      logger.info(`Enhancing article with Ollama (${this.model})...`);
      
      // First ensure model exists
      const modelAvailable = await this.ensureModelExists();
      if (!modelAvailable) {
        throw new Error(`Model ${this.model} not available. Run 'ollama pull ${this.model}' first.`);
      }
      
      // Prepare the prompt
      const prompt = this.createEnhancementPrompt(originalArticle, competitorArticles);
      
      logger.debug('Sending request to Ollama...');
      
      const response = await ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer and SEO expert. Your task is to enhance articles while maintaining their original meaning and improving readability, structure, and SEO.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: config.ai.ollama.temperature,
          num_predict: config.ai.ollama.maxTokens,
        },
        stream: false,
      });
      
      const enhancedContent = response.message.content;
      
      // Extract references section if present
      const references = this.extractReferences(enhancedContent, competitorArticles);
      
      // Remove references from main content if they were included
      const cleanContent = this.removeReferencesSection(enhancedContent);
      
      logger.info('✅ Article enhanced successfully with Ollama');
      logger.debug(`Enhanced content length: ${cleanContent.length} characters`);
      
      return {
        enhancedContent: cleanContent,
        references,
        model: this.model,
        success: true,
      };
      
    } catch (error) {
      logger.error('Error enhancing article with Ollama:', error.message);
      return {
        enhancedContent: '',
        references: [],
        error: error.message,
        success: false,
      };
    }
  }

  createEnhancementPrompt(originalArticle, competitorArticles) {
    return `I need you to enhance and improve the following article based on the structure, formatting, and style of competitor articles.

ORIGINAL ARTICLE:
Title: ${originalArticle.title}
Content: ${originalArticle.originalContent.substring(0, 3000)}...

COMPETITOR ARTICLES (for reference on style and structure):
${competitorArticles.map((a, i) => `Article ${i + 1}: ${a.title}
Key points from their structure:
- ${a.content.substring(0, 500).split('. ').slice(0, 3).join('. ') + '...'}`).join('\n\n')}

TASK:
1. Enhance the original article by improving:
   - Structure and formatting (use proper headings H2, H3, paragraphs, bullet points)
   - Readability and flow
   - SEO optimization (include relevant keywords naturally)
   - Engagement (make it more compelling to read)
   - Professional tone

2. IMPORTANT RULES:
   - DO NOT change the core message or facts from the original article
   - DO NOT make it shorter than the original
   - Maintain the original article's perspective and voice
   - Add proper formatting like headings, bullet points, and paragraphs
   - Make it similar in quality and structure to the competitor articles

3. REFERENCES SECTION:
   At the VERY END of the article, add a "References" section with the competitor article URLs.
   Format it exactly like this:
   
   References:
   - [Competitor Article 1 Title](${competitorArticles[0]?.url})
   - [Competitor Article 2 Title](${competitorArticles[1]?.url})

Now, please provide the enhanced version of the article:`;
  }

  extractReferences(content, competitorArticles) {
    const referenceUrls = [];
    
    // Look for references section
    const referenceMatch = content.match(/References?:\s*([\s\S]*?)(?=\n\n|$)/i);
    
    if (referenceMatch) {
      // Extract URLs from the references section
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = referenceMatch[1].match(urlRegex) || [];
      
      referenceUrls.push(...urls);
    }
    
    // Also include all competitor URLs
    competitorArticles.forEach(article => {
      if (article.url && !referenceUrls.includes(article.url)) {
        referenceUrls.push(article.url);
      }
    });
    
    // Deduplicate and limit
    return [...new Set(referenceUrls)].slice(0, config.google.competitorArticles);
  }

  removeReferencesSection(content) {
    // Remove the references section if present
    return content.replace(/References?:\s*([\s\S]*?)(?=\n\n|$)/i, '').trim();
  }

  async testConnection() {
    try {
      logger.info('Testing Ollama connection...');
      
      // Check if Ollama is running
      await ollama.list();
      
      // Check if model exists
      const modelAvailable = await this.ensureModelExists();
      
      if (modelAvailable) {
        logger.info('✅ Ollama connection successful');
        return true;
      } else {
        logger.error('Ollama model not available');
        return false;
      }
    } catch (error) {
      logger.error('Ollama connection failed:', error.message);
      logger.info('Make sure Ollama is running. Start it with: ollama serve');
      return false;
    }
  }
}

module.exports = OllamaService;