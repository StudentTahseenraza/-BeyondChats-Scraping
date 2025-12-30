const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const config = require('../config/config');

class GeminiService {
  constructor() {
    if (!config.ai.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required in .env file');
    }

    this.genAI = new GoogleGenerativeAI(config.ai.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.ai.gemini.model,
      generationConfig: {
        temperature: config.ai.gemini.temperature,
        maxOutputTokens: config.ai.gemini.maxTokens,
      }
    });

    logger.info(`✅ Gemini service initialized with model: ${config.ai.gemini.model}`);
  }

  async enhanceArticle(originalArticle, competitorArticles) {
    try {
      logger.info('Enhancing article with Gemini AI...');

      // Prepare the prompt
      const prompt = this.createEnhancementPrompt(originalArticle, competitorArticles);

      logger.debug('Sending request to Gemini AI...');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const enhancedContent = response.text();

      // Extract references section if present
      const references = this.extractReferences(enhancedContent, competitorArticles);

      // Remove references from main content if they were included
      const cleanContent = this.removeReferencesSection(enhancedContent);

      logger.info('✅ Article enhanced successfully with Gemini');
      logger.debug(`Enhanced content length: ${cleanContent.length} characters`);

      return {
        enhancedContent: cleanContent,
        references,
        model: config.ai.gemini.model,
        success: true,
      };

    } catch (error) {
      logger.error('Error enhancing article with Gemini:', error.message);
      return {
        enhancedContent: '',
        references: [],
        error: error.message,
        success: false,
      };
    }
  }

  createEnhancementPrompt(originalArticle, competitorArticles) {
    const originalTitle = originalArticle.title;
    const originalContent = originalArticle.originalContent || '';

    let competitorAnalysis = '';
    if (competitorArticles && competitorArticles.length > 0) {
      competitorAnalysis = `## REAL COMPETITOR ARTICLE ANALYSIS

I found and analyzed ${competitorArticles.length} real competitor articles. Here's what I learned from their structure:

${competitorArticles.map((article, i) => {
        const contentPreview = article.content.substring(0, 800);
        const wordCount = article.content.split(/\s+/).length;
        return `### Competitor ${i + 1}: "${article.title}"
**Source:** ${article.url}
**Length:** ${wordCount} words
**Key Observations:** ${this.extractCompetitorInsights(article.content)}`;
      }).join('\n\n')}

### COMPETITOR STRUCTURE PATTERNS OBSERVED:
1. Clear hierarchy with H2 and H3 headings
2. Short paragraphs (2-4 sentences each)
3. Bullet points for lists and key takeaways
4. Examples and case studies
5. Data and statistics
6. Strong introduction and conclusion`;
    } else {
      competitorAnalysis = `## NO COMPETITOR ARTICLES AVAILABLE

No competitor articles were successfully scraped. Please enhance the article using standard professional writing best practices:
- Clear structure with headings
- Short, readable paragraphs
- Bullet points for key information
- Professional yet engaging tone`;
    }

    return `You are a professional content editor. Enhance this article to be competitive with top-ranking articles online.

## ORIGINAL ARTICLE:
**Title:** ${originalTitle}
**Content:** ${originalContent.substring(0, 3000)}${originalContent.length > 3000 ? '...' : ''}

${competitorAnalysis}

## ENHANCEMENT INSTRUCTIONS:

### 1. IMPROVE STRUCTURE:
- Add descriptive H2 headings for main sections
- Use H3 subheadings where needed
- Break into short paragraphs (2-4 sentences)
- Use bullet points (•) for lists
- Use numbered lists for steps
- Add **bold** emphasis on key terms

### 2. IMPROVE CONTENT:
- Enhance readability and flow
- Add transitional phrases
- Use active voice
- Maintain original facts and message
- Make it MORE detailed than original (add value)

### 3. SEO & READABILITY:
- Include relevant keywords naturally
- Ensure clear heading hierarchy
- Optimize for both readers and search engines

### 4. REFERENCES SECTION (IF COMPETITORS EXIST):
${competitorArticles && competitorArticles.length > 0
        ? `At the end, add:
## References
${competitorArticles.map(a => `- [${a.title}](${a.url})`).join('\n')}`
        : 'No references to add since no competitor articles were found.'}

## OUTPUT:
Provide the complete enhanced article with proper formatting. Make it substantially better than the original while keeping the core message.

Enhanced version of "${originalTitle}":`;
  }

  extractCompetitorInsights(content) {
    if (!content) return "No content available";

    const insights = [];

    // Check structure
    const paragraphs = content.split(/\n\s*\n/).length;
    const avgParagraphLength = content.length / paragraphs;

    if (avgParagraphLength < 500) insights.push("Uses short, scannable paragraphs");
    if (content.includes('•') || content.includes('- ') || content.includes('* ')) insights.push("Uses bullet points");
    if (content.includes('##') || content.match(/[A-Z][A-Z\s]{10,}/)) insights.push("Has clear heading structure");
    if (content.includes('example') || content.includes('case study')) insights.push("Includes examples");
    if (/\d+%/.test(content) || /\$\d+/.test(content)) insights.push("Uses statistics/data");

    return insights.length > 0 ? insights.join(', ') : "Standard professional article structure";
  }

  removeReferencesSection(content) {
    // Remove the references section if present
    return content.replace(/References?:\s*([\s\S]*?)(?=\n\n|$)/i, '').trim();
  }

  async testConnection() {
    try {
      logger.info('Testing Gemini API connection...');

      const result = await this.model.generateContent("Hello, this is a test. Please respond with 'OK' if you can read this.");
      const response = await result.response;
      const text = response.text();

      if (text.includes('OK')) {
        logger.info('✅ Gemini API connection successful');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Gemini API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = GeminiService;