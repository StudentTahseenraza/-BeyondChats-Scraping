const Article = require('../models/Article');
const axios = require('axios');
const config = require('../config/config'); // You'll need to create this config

class AIController {
    /**
     * Trigger AI enhancement for a single article via external AI script
     */
    async enhanceArticle(req, res) {
        try {
            const { id } = req.params;
            const { model = 'gemini' } = req.body;

            console.log(`🤖 Triggering AI enhancement for article ${id} with model: ${model}`);

            // Get the article
            const article = await Article.findById(id);
            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
            }

            // Check if already enhanced
            if (article.isUpdated && article.source === 'ai-updated') {
                return res.status(400).json({
                    success: false,
                    message: 'Article is already enhanced with AI',
                    data: article,
                });
            }

            // Call the external AI processing script (running separately)
            // This could be via HTTP call to the AI script's API or running a child process
            // For simplicity, we'll simulate the enhancement here
            // In production, you'd call your AI script's endpoint
            
            try {
                // Option 1: Call AI script via HTTP (if it has an API)
                const aiScriptUrl = process.env.AI_SCRIPT_URL || 'http://localhost:6000';
                const response = await axios.post(`${aiScriptUrl}/api/process-article`, {
                    articleId: id,
                    model: model
                }, {
                    timeout: 300000 // 5 minutes timeout for AI processing
                });

                if (response.data.success) {
                    // Update the article with AI-enhanced content
                    const updatedArticle = await Article.findByIdAndUpdate(
                        id,
                        {
                            updatedContent: response.data.enhancedContent,
                            references: response.data.references || [],
                            isUpdated: true,
                            source: 'ai-updated',
                            aiModel: response.data.model,
                            enhancedAt: new Date()
                        },
                        { new: true }
                    );

                    return res.status(200).json({
                        success: true,
                        message: 'Article enhanced successfully with AI',
                        data: updatedArticle,
                        enhancementInfo: {
                            model: response.data.model,
                            contentLength: response.data.contentLength,
                            referencesCount: response.data.references?.length || 0,
                        },
                    });
                } else {
                    throw new Error(response.data.error || 'AI enhancement failed');
                }

            } catch (aiError) {
                console.error('AI script error:', aiError.message);
                
                // Fallback: Simulate enhancement (for demo/testing)
                if (process.env.NODE_ENV === 'development') {
                    console.log('Using simulated enhancement for development');
                    
                    const simulatedContent = this.simulateAIEnhancement(article);
                    
                    const updatedArticle = await Article.findByIdAndUpdate(
                        id,
                        {
                            updatedContent: simulatedContent,
                            references: [
                                'https://example.com/competitor-article-1',
                                'https://example.com/competitor-article-2'
                            ],
                            isUpdated: true,
                            source: 'ai-updated',
                            aiModel: 'simulated',
                            enhancedAt: new Date()
                        },
                        { new: true }
                    );

                    return res.status(200).json({
                        success: true,
                        message: 'Article enhanced (simulated) for development',
                        data: updatedArticle,
                        enhancementInfo: {
                            model: 'simulated',
                            contentLength: simulatedContent.length,
                            referencesCount: 2,
                        },
                        note: 'This is a simulated enhancement for development/demo purposes'
                    });
                }

                throw aiError;
            }

        } catch (error) {
            console.error('Error in enhanceArticle controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error enhancing article',
                error: error.message,
            });
        }
    }

    /**
     * Enhance all unprocessed articles
     */
    async enhanceAllArticles(req, res) {
        try {
            const { model = 'gemini', limit = 5 } = req.body;

            console.log(`🤖 Triggering batch AI enhancement for up to ${limit} articles with model: ${model}`);

            // Get unprocessed articles
            const articles = await Article.find({
                source: 'original',
                isUpdated: false,
            }).limit(limit);

            if (articles.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No articles need enhancement',
                    data: [],
                });
            }

            console.log(`Found ${articles.length} articles to enhance`);

            // Process articles one by one
            const results = [];
            let successCount = 0;
            let failedCount = 0;

            for (const article of articles) {
                try {
                    console.log(`Processing article: ${article.title}`);
                    
                    // Call AI enhancement for each article
                    const aiScriptUrl = process.env.AI_SCRIPT_URL || 'http://localhost:6000';
                    const response = await axios.post(`${aiScriptUrl}/api/process-article`, {
                        articleId: article._id,
                        model: model
                    }, {
                        timeout: 300000
                    });

                    if (response.data.success) {
                        // Update article in database
                        await Article.findByIdAndUpdate(
                            article._id,
                            {
                                updatedContent: response.data.enhancedContent,
                                references: response.data.references || [],
                                isUpdated: true,
                                source: 'ai-updated',
                                aiModel: response.data.model,
                                enhancedAt: new Date()
                            }
                        );

                        successCount++;
                        results.push({
                            articleId: article._id,
                            title: article.title,
                            status: 'success',
                            model: response.data.model,
                        });

                        console.log(`✅ Enhanced: ${article.title}`);
                    } else {
                        failedCount++;
                        results.push({
                            articleId: article._id,
                            title: article.title,
                            status: 'failed',
                            error: response.data.error || 'Unknown error',
                        });

                        console.log(`❌ Failed: ${article.title}`);
                    }

                    // Delay between processing to avoid rate limiting
                    if (article !== articles[articles.length - 1]) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }

                } catch (error) {
                    failedCount++;
                    results.push({
                        articleId: article._id,
                        title: article.title,
                        status: 'error',
                        error: error.message,
                    });

                    console.error(`❌ Error processing ${article.title}:`, error.message);
                }
            }

            return res.status(200).json({
                success: true,
                message: `Batch processing completed. Success: ${successCount}, Failed: ${failedCount}`,
                statistics: {
                    total: articles.length,
                    success: successCount,
                    failed: failedCount,
                    successRate: `${((successCount / articles.length) * 100).toFixed(1)}%`,
                },
                results: results,
            });

        } catch (error) {
            console.error('Error in enhanceAllArticles controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error in batch enhancement',
                error: error.message,
            });
        }
    }

    /**
     * Get AI enhancement status
     */
    async getEnhancementStatus(req, res) {
        try {
            const totalArticles = await Article.countDocuments();
            const originalArticles = await Article.countDocuments({ source: 'original' });
            const enhancedArticles = await Article.countDocuments({ 
                source: 'ai-updated', 
                isUpdated: true 
            });
            const pendingArticles = await Article.countDocuments({ 
                source: 'original', 
                isUpdated: false 
            });

            // Get recently enhanced articles
            const recentlyEnhanced = await Article.find({ 
                source: 'ai-updated',
                isUpdated: true 
            })
                .sort({ enhancedAt: -1 })
                .limit(5)
                .select('title enhancedAt aiModel references updatedContent');

            return res.status(200).json({
                success: true,
                data: {
                    totalArticles,
                    originalArticles: originalArticles + enhancedArticles,
                    enhancedArticles,
                    pendingArticles,
                    needsEnhancement: pendingArticles > 0,
                    recentlyEnhanced,
                    status: pendingArticles === 0 ? 'All enhanced' : `${pendingArticles} pending`,
                },
            });

        } catch (error) {
            console.error('Error getting enhancement status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error getting enhancement status',
                error: error.message,
            });
        }
    }

    /**
     * Test AI service connection
     */
    async testAIConnection(req, res) {
        try {
            const { model = 'gemini' } = req.body;

            console.log(`Testing ${model} AI connection...`);

            // Test connection to AI script
            const aiScriptUrl = process.env.AI_SCRIPT_URL || 'http://localhost:6000';
            
            try {
                const response = await axios.get(`${aiScriptUrl}/api/health`, {
                    timeout: 10000
                });

                return res.status(200).json({
                    success: response.data.status === 'OK',
                    message: response.data.status === 'OK' 
                        ? `${model.toUpperCase()} AI service is running` 
                        : `${model.toUpperCase()} AI service not responding properly`,
                    model: model,
                    timestamp: new Date().toISOString(),
                    details: response.data
                });

            } catch (error) {
                console.error('AI service connection test failed:', error.message);
                
                return res.status(200).json({
                    success: false,
                    message: `${model.toUpperCase()} AI service is not running or not accessible`,
                    model: model,
                    error: error.message,
                    suggestion: 'Make sure the AI processing script is running on port 6000'
                });
            }

        } catch (error) {
            console.error('Error testing AI connection:', error);
            return res.status(500).json({
                success: false,
                message: 'Error testing AI connection',
                error: error.message,
            });
        }
    }

    /**
     * Simulate AI enhancement for development/demo
     */
    simulateAIEnhancement(article) {
        const originalContent = article.originalContent || article.originalText || '';
        
        return `
# ${article.title}

## Introduction
This article has been enhanced with AI to improve readability and structure while maintaining the original message.

${originalContent.substring(0, 500)}

## Key Improvements Added by AI
- **Better Structure**: Clear headings and subheadings
- **Improved Readability**: Shorter paragraphs and better flow
- **Enhanced SEO**: Optimized for search engines
- **Professional Tone**: More engaging and authoritative

## Main Content
${originalContent}

## Conclusion
The AI enhancement has made this article more competitive with top-ranking content while preserving the original insights and information.

## References
- Reference Article 1: https://example.com/competitor-article-1
- Reference Article 2: https://example.com/competitor-article-2
`;
    }
}

module.exports = new AIController();
