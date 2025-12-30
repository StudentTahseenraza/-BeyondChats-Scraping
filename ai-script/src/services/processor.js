const logger = require('../utils/logger');
const config = require('../config/config');
const ApiClient = require('./api-client');
const GoogleSearchService = require('./google-search');
const ContentScraperService = require('./content-scraper');
const AIServiceFactory = require('./ai-service-factory');

class ArticleProcessor {
    constructor(aiModel = null) {
        this.apiClient = ApiClient;
        this.googleSearch = new GoogleSearchService();
        this.contentScraper = ContentScraperService;
        this.aiService = null;
        this.requestedModel = aiModel || config.ai.model;
        this.stats = {
            totalProcessed: 0,
            successfullyEnhanced: 0,
            failed: 0,
            startTime: null,
            endTime: null,
        };
    }

    async initialize() {
        try {
            logger.section('INITIALIZING AI AUTOMATION SCRIPT');
            logger.info(`Using AI model: ${this.requestedModel}`);

            // Test backend connection
            const apiConnected = await this.apiClient.testConnection();
            if (!apiConnected) {
                throw new Error('Cannot connect to backend API');
            }

            // Initialize AI service
            this.aiService = AIServiceFactory.createService();
            const aiConnected = await this.aiService.testConnection();
            if (!aiConnected) {
                throw new Error(`Cannot connect to ${this.requestedModel} AI service`);
            }

            // Initialize Google Search (no longer uses Puppeteer)
            await this.googleSearch.init();

            logger.info('✅ All services initialized successfully');
            return true;

        } catch (error) {
            logger.error('Initialization failed:', error.message);

            // Give specific setup instructions
            if (error.message.includes('Gemini') || error.message.includes('GEMINI_API_KEY')) {
                logger.info('\n🔧 SETUP REQUIRED:');
                logger.info('1. Get free Gemini API key: https://makersuite.google.com/app/apikey');
                logger.info('2. Add to .env: GEMINI_API_KEY=your_key_here');
            }

            if (error.message.includes('Google API')) {
                logger.info('\n🔧 FOR GOOGLE SEARCH (Optional but recommended):');
                logger.info('1. Get Google API key: https://console.cloud.google.com');
                logger.info('2. Create Search Engine: https://programmablesearchengine.google.com');
                logger.info('3. Add to .env:');
                logger.info('   GOOGLE_API_KEY=your_key_here');
                logger.info('   GOOGLE_SEARCH_ENGINE_ID=your_id_here');
            }

            return false;
        }
    }

    // processor.js (FULL FIX)
    async processArticle(article) {
        try {
            logger.section(`PROCESSING ARTICLE: ${article.title}`);
            logger.info(`Article ID: ${article._id}`);
            logger.info(`Using AI: ${this.requestedModel}`);

            // Step 1: Google Search
            logger.info('🔍 Step 1: Searching Google for similar articles...');
            const searchResults = await this.googleSearch.searchArticleTitle(article.title);

            let competitorArticles = [];
            if (searchResults.length > 0) {
                logger.info(`Found ${searchResults.length} competitor articles`);
                searchResults.forEach((r, i) => {
                    logger.info(`  ${i + 1}. ${r.title} (${r.url})`);
                });

                // Step 2: Scrape competitors
                logger.info('📄 Step 2: Scraping competitor articles...');
                const urls = searchResults.map(r => r.url);
                const scrapedArticles = await this.contentScraper.scrapeMultipleArticles(urls);

                // Filter successful scrapes
                competitorArticles = scrapedArticles.filter(a => a.success && a.content.length > 100);

                if (competitorArticles.length === 0) {
                    logger.warn('No competitor articles successfully scraped - using URLs only');
                    // Still keep URLs for references even if scraping failed
                    competitorArticles = searchResults.map(r => ({
                        url: r.url,
                        title: r.title,
                        content: `Competitor article from ${r.url}`,
                        success: false
                    }));
                } else {
                    logger.info(`Successfully scraped ${competitorArticles.length} competitor articles`);
                }
            } else {
                logger.warn('No competitor articles found');
            }

            // Step 3: AI Enhancement
            logger.info(`🤖 Step 3: Enhancing article with ${this.requestedModel.toUpperCase()}...`);
            const enhancementResult = await this.aiService.enhanceArticle(
                article,
                competitorArticles
            );

            if (!enhancementResult.success || !enhancementResult.enhancedContent) {
                throw new Error('AI enhancement failed: ' + (enhancementResult.error || 'No content generated'));
            }

            // Extract references from enhanced content
            let references = enhancementResult.references || [];
            if (references.length === 0 && competitorArticles.length > 0) {
                // Fallback: use competitor URLs as references
                references = competitorArticles.map(a => a.url).filter(url => url);
            }

            logger.info(`Enhanced content generated (${enhancementResult.enhancedContent.length} chars)`);
            logger.info(`References to include: ${references.length} URLs`);

            // Step 4: Save
            logger.info('💾 Step 4: Saving enhanced article...');
            const updateData = {
                updatedContent: enhancementResult.enhancedContent,
                references: references,
                isUpdated: true,
                source: 'ai-updated',
                aiModel: enhancementResult.model,
                enhancedAt: new Date().toISOString(),
            };

            await this.apiClient.updateArticle(article._id, updateData);

            logger.info('✅ Article processed successfully');

            return {
                articleId: article._id,
                originalTitle: article.title,
                success: true,
                model: enhancementResult.model,
                contentLength: {
                    original: article.originalContent?.length || 0,
                    enhanced: enhancementResult.enhancedContent.length,
                },
                referencesCount: references.length,
            };

        } catch (error) {
            logger.error(`Error processing article ${article._id}:`, error.message);
            return {
                articleId: article._id,
                success: false,
                reason: error.message,
                model: this.requestedModel,
            };
        }
    }


    async processAllArticles() {
        try {
            this.stats.startTime = new Date();
            logger.section('STARTING BATCH PROCESSING');

            // Get articles to process
            const articles = await this.apiClient.getArticles();

            if (articles.length === 0) {
                logger.info('No articles to process. All articles may already be updated.');
                return this.generateReport();
            }

            logger.info(`Found ${articles.length} articles to process`);

            // Process each article
            const results = [];
            for (const article of articles) {
                const result = await this.processArticle(article);
                results.push(result);

                // Update statistics
                if (result.success) {
                    this.stats.successfullyEnhanced++;
                } else {
                    this.stats.failed++;
                }
                this.stats.totalProcessed++;

                // Add delay between articles
                if (article !== articles[articles.length - 1]) {
                    logger.info('⏳ Waiting before next article...');
                    await new Promise(resolve => setTimeout(resolve, config.script.requestDelay * 3));
                }
            }

            this.stats.endTime = new Date();

            // Generate final report
            return this.generateReport(results);

        } catch (error) {
            logger.error('Batch processing failed:', error);
            return this.generateReport([], error);
        } finally {
            // Cleanup
            await this.cleanup();
        }
    }

    async processSingleArticle(articleId) {
        try {
            logger.section(`PROCESSING SINGLE ARTICLE: ${articleId}`);

            // Get specific article
            const article = await this.apiClient.getArticleById(articleId);

            if (!article) {
                logger.error(`Article ${articleId} not found`);
                return {
                    success: false,
                    message: 'Article not found',
                };
            }

            // Check if already updated
            if (article.isUpdated) {
                logger.warn(`Article ${articleId} is already updated`);
                return {
                    success: false,
                    message: 'Article is already updated',
                    article,
                };
            }

            // Process the article
            const result = await this.processArticle(article);

            return {
                success: result.success,
                data: result,
            };

        } catch (error) {
            logger.error(`Single article processing failed:`, error);
            return {
                success: false,
                error: error.message,
            };
        } finally {
            await this.cleanup();
        }
    }

    generateReport(results = [], error = null) {
        const duration = this.stats.endTime
            ? (this.stats.endTime - this.stats.startTime) / 1000
            : 0;

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration.toFixed(2)} seconds`,
            statistics: {
                totalProcessed: this.stats.totalProcessed,
                successfullyEnhanced: this.stats.successfullyEnhanced,
                failed: this.stats.failed,
                successRate: this.stats.totalProcessed > 0
                    ? ((this.stats.successfullyEnhanced / this.stats.totalProcessed) * 100).toFixed(2) + '%'
                    : '0%',
            },
            results: results,
        };

        if (error) {
            report.error = error.message;
        }

        logger.section('PROCESSING REPORT');
        logger.info(`Duration: ${report.duration}`);
        logger.info(`Total processed: ${report.statistics.totalProcessed}`);
        logger.info(`Successfully enhanced: ${report.statistics.successfullyEnhanced}`);
        logger.info(`Failed: ${report.statistics.failed}`);
        logger.info(`Success rate: ${report.statistics.successRate}`);

        // Log detailed results - FIXED
        if (results.length > 0) {
            logger.info('\nDetailed Results:');
            results.forEach((result, index) => {
                if (result.success) {
                    logger.info(`✅ ${index + 1}. Article ${result.articleId} - SUCCESS`);
                    logger.info(`   Model used: ${result.model}`);
                } else {
                    logger.info(`❌ ${index + 1}. ${result.articleId} - FAILED: ${result.reason}`);
                }
            });
        }

        return report;
    }

    async cleanup() {
        try {
            logger.info('Cleaning up resources...');

            if (this.googleSearch) {
                await this.googleSearch.close();
            }

            logger.info('✅ Cleanup completed');
        } catch (error) {
            logger.error('Error during cleanup:', error.message);
        }
    }
}

module.exports = ArticleProcessor;