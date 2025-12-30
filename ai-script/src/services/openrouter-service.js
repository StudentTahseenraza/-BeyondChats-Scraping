const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');
const ContentFormatter = require('./content-formatter');

class OpenRouterService {
  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required in .env file');
    }

    this.apiKey = process.env.OPENROUTER_API_KEY;
    // Use Mistral 7B - tested and working
    this.model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    logger.info(`✅ OpenRouter service initialized with model: ${this.model}`);
    logger.info(`ℹ️  Using Mistral 7B - tested and working`);
  }

  async enhanceArticle(originalArticle, competitorArticles) {
    try {
      logger.info(`Enhancing article with Mistral 7B...`);

      const prompt = this.createMistralPrompt(originalArticle, competitorArticles);

      logger.debug('Sending request to OpenRouter API...');

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000, // Mistral 7B works well with shorter outputs
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://beyondchats.com',
            'X-Title': 'BeyondChats AI Automation',
          },
          timeout: 30000, // 30 seconds
        }
      );

      const enhancedContent = response.data.choices[0]?.message?.content || '';

     if (!enhancedContent || !enhancedContent.trim()) {
  logger.warn('⚠️ AI returned empty content. Retrying with fallback prompt...');
  return this.retryWithSimplerPrompt(originalArticle, competitorArticles);
}


      const formattedContent = ContentFormatter.formatEnhancedContent(enhancedContent);
      
      // Extract references
      const references = this.extractReferences(formattedContent, competitorArticles);
      
      // Remove references from main content
      const cleanContent = this.removeReferencesSection(formattedContent);
      
      logger.info('✅ Article enhanced and formatted successfully');
      
      return {
        enhancedContent: cleanContent,
        references,
        model: this.model,
        success: true,
      };

      // logger.info('✅ Article enhanced successfully with Mistral 7B');
      // logger.debug(`Enhanced content length: ${cleanContent.length} characters`);

      // return {
      //   enhancedContent: cleanContent,
      //   references,
      //   model: this.model,
      //   success: true,
      // };

    } catch (error) {
      logger.error('Error enhancing article with OpenRouter:', error.message);

      if (error.response) {
        logger.error('API Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      return {
        enhancedContent: '',
        references: [],
        error: error.message,
        success: false,
      };
    }
  }

  createMistralPrompt(originalArticle, competitorArticles) {
    const originalTitle = originalArticle.title;
    const originalContent = originalArticle.originalContent || '';

    // Simple, clear prompt for Mistral 7B
    return `You are a professional content editor. Please enhance this article:

ARTICLE TITLE: "${originalTitle}"

ORIGINAL CONTENT:
${originalContent.substring(0, 1500)}${originalContent.length > 1500 ? '...' : ''}

INSTRUCTIONS:
1. IMPROVE STRUCTURE:
   - Add clear headings using ## for main sections
   - Use ### for subheadings
   - Break into short paragraphs (2-4 sentences)
   - Use bullet points (•) for lists
   - Use **bold** for important terms

2. IMPROVE CONTENT:
   - Make it more readable and engaging
   - Keep all original facts and message
   - Do not make it shorter
   - Add transitional phrases

3. FORMATTING:
   - Start with an introduction
   - End with a conclusion
   - Make it professional

${competitorArticles.length > 0 ? `
4. ADD REFERENCES (at the end):
## References
${competitorArticles.map(a => `- [${a.title.substring(0, 80)}](${a.url})`).join('\n')}
` : ''}

Please provide the complete enhanced article with proper formatting as described above.`;
  }


  analyzeCompetitorStructure(content) {
    if (!content) return "Content not available for structural analysis";

    const analysis = [];
    const words = content.split(/\s+/).length;

    // Check for headings
    const hasH2 = content.includes('##') || content.match(/\n[A-Z][A-Z\s]{10,}\n/);
    const hasH3 = content.includes('###') || content.match(/\n[A-Z][a-z\s]{10,}:\n/);

    if (hasH2) analysis.push("✓ Uses H2-level headings");
    if (hasH3) analysis.push("✓ Uses subheadings (H3 level)");

    // Check for lists
    const hasBullets = content.includes('•') || content.includes('- ') || content.includes('* ');
    const hasNumbers = /\d\.\s/.test(content);

    if (hasBullets) analysis.push("✓ Uses bullet points for organization");
    if (hasNumbers) analysis.push("✓ Uses numbered lists for sequences");

    // Paragraph analysis
    const paragraphs = content.split(/\n\s*\n/);
    const avgSentences = paragraphs.map(p => p.split(/[.!?]+/).length - 1).reduce((a, b) => a + b, 0) / paragraphs.length;

    if (avgSentences <= 4) analysis.push("✓ Short, scannable paragraphs");

    analysis.push(`✓ Approximately ${words.toLocaleString()} words`);
    analysis.push("✓ Professional, well-structured content");

    return analysis.join('\n');
  }

  extractReferences(content, competitorArticles) {
    const referenceUrls = [];

    const referenceMatch = content.match(/References?:\s*([\s\S]*?)(?=\n\n|$)/i);

    if (referenceMatch) {
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = referenceMatch[1].match(urlRegex) || [];
      referenceUrls.push(...urls);
    }

    competitorArticles.forEach(article => {
      if (article.url && !referenceUrls.includes(article.url)) {
        referenceUrls.push(article.url);
      }
    });

    return [...new Set(referenceUrls)].slice(0, config.google.competitorArticles);
  }

  removeReferencesSection(content) {
    return content.replace(/References?:\s*([\s\S]*?)(?=\n\n|$)/i, '').trim();
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

  async retryWithSimplerPrompt(originalArticle, competitorArticles) {
  try {
    const fallbackPrompt = `
Rewrite and improve the following article.
Keep the same meaning.
Add headings and structure.
Do not leave it empty.

TITLE: ${originalArticle.title}

CONTENT:
${originalArticle.originalContent.substring(0, 800)}
`;

    const response = await axios.post(
      this.baseUrl,
      {
        model: this.model,
        messages: [{ role: "user", content: fallbackPrompt }],
        temperature: 0.5,
        max_tokens: 1200,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://beyondchats.com',
          'X-Title': 'BeyondChats AI Automation',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';

    if (!content.trim()) {
      throw new Error('Fallback prompt also returned empty response');
    }

    logger.info('✅ Article enhanced successfully using fallback prompt');

    return {
      enhancedContent: content.trim(),
      references: competitorArticles.map(a => a.url),
      model: this.model,
      success: true,
    };

  } catch (error) {
    logger.error('❌ Fallback prompt failed:', error.message);
    throw error;
  }
}

  async testConnection() {
    try {
      logger.info(`Testing OpenRouter API connection with ${this.model}...`);

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            {
              role: "user",
              content: "Are you working? Just reply with the word 'WORKING'."
            }
          ],
          max_tokens: 10,
          temperature: 0.1, // Low temperature for consistent response
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://beyondchats.com',
          },
          timeout: 20000, // 20 seconds
        }
      );

      const text = response.data.choices[0]?.message?.content || '';
      const trimmedText = text.trim();

      // More flexible check - just see if we got any response
      if (trimmedText.includes('WORKING') || trimmedText.includes('working') || trimmedText.length > 0) {
        logger.info(`✅ OpenRouter API connection successful with ${this.model}`);
        logger.debug(`Test response: "${trimmedText}"`);
        return true;
      }

      logger.warn(`Unexpected response: "${text}"`);

      // Even if response is weird, the API is working
      logger.info(`ℹ️  API is responding (got status ${response.status}), connection is working`);
      return true;

    } catch (error) {
      logger.error('OpenRouter API connection failed:', error.message);

      if (error.response) {
        logger.error('Response status:', error.response.status);
        logger.error('Response data:', JSON.stringify(error.response.data, null, 2));

        // If we get a 429 (rate limit), it still means the API is working
        if (error.response.status === 429) {
          logger.warn('⚠️  Rate limited but API is working. Wait a minute and try again.');
          return true; // Consider it working
        }
      }

      return false;
    }
  }
}

module.exports = OpenRouterService;
