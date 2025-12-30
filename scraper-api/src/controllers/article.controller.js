const Article = require('../models/Article');
const scraperService = require('../services/scraper.service');


class ArticleController {
    /**
     * Scrape and save articles
     */
    async scrapeArticles(req, res) {
        const articleData = {
            title: scrapedArticle.title,
            originalContent: scrapedArticle.originalContent || 'No content available',
            originalText: scrapedArticle.originalText || scrapedArticle.excerpt || '',
            originalUrl: scrapedArticle.originalUrl,
            source: 'original',
            publishedDate: scrapedArticle.publishedDate || new Date(),
            scrapedAt: scrapedArticle.scrapedAt || new Date(),
            images: scrapedArticle.images || []
        };

        // Only add slug if we have one
        if (slug && slug.length > 0) {
            articleData.slug = slug;
        }
        try {
            console.log('🔧 Starting article scraping process...');

            // Check if articles already exist
            const existingCount = await Article.countDocuments({ source: 'original' });
            if (existingCount >= 5) {
                const articles = await Article.find({ source: 'original' })
                    .sort({ createdAt: -1 })
                    .limit(5);

                return res.status(200).json({
                    success: true,
                    message: 'Articles already exist in database',
                    count: articles.length,
                    data: articles,
                });
            }

            // Scrape new articles
            const scrapedArticles = await scraperService.scrapeOldestArticles();

            // Save to database
            const savedArticles = [];
            const errors = [];

            for (const scrapedArticle of scrapedArticles) {
                try {
                    // Generate slug from title
                    const slug = scrapedArticle.title
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '') // Remove special chars
                        .replace(/\s+/g, '-')     // Replace spaces with hyphens
                        .replace(/-+/g, '-')      // Replace multiple hyphens
                        .trim()
                        .substring(0, 100);       // Limit length

                    // Check if article already exists by URL or slug
                    const existingArticle = await Article.findOne({
                        $or: [
                            { originalUrl: scrapedArticle.originalUrl },
                            { slug: slug }
                        ]
                    });

                    if (existingArticle) {
                        console.log(`⏭️ Skipping (already exists): ${scrapedArticle.title}`);
                        continue;
                    }

                    // Create article WITHOUT pre-save middleware issues
                    const articleData = {
                        title: scrapedArticle.title,
                        originalContent: scrapedArticle.originalContent || 'No content available',
                        originalUrl: scrapedArticle.originalUrl,
                        source: 'original',
                        publishedDate: scrapedArticle.publishedDate || new Date(),
                        scrapedAt: scrapedArticle.scrapedAt || new Date(),
                    };

                    // Only add slug if we have one
                    if (slug && slug.length > 0) {
                        articleData.slug = slug;
                    }

                    const article = new Article(articleData);

                    // Save without triggering problematic middleware
                    await article.save({ validateBeforeSave: true });

                    savedArticles.push(article);
                    console.log(`✅ Saved: ${scrapedArticle.title}`);

                } catch (saveError) {
                    console.error(`❌ Error saving article "${scrapedArticle.title}":`, saveError.message);
                    errors.push({
                        title: scrapedArticle.title,
                        error: saveError.message
                    });
                }
            }

            // Return response
            const response = {
                success: true,
                message: `Successfully processed ${scrapedArticles.length} articles`,
                savedCount: savedArticles.length,
                data: savedArticles,
            };

            // Add errors if any
            if (errors.length > 0) {
                response.errors = errors;
                response.partialSuccess = true;
            }

            res.status(savedArticles.length > 0 ? 201 : 400).json(response);

        } catch (error) {
            console.error('❌ Error in scrapeArticles:', error);

            // Handle specific errors
            let statusCode = 500;
            let errorMessage = 'Error scraping articles';

            if (error.name === 'MongoServerError' && error.code === 11000) {
                statusCode = 400;
                errorMessage = 'Duplicate article found (URL or slug already exists)';
            } else if (error.name === 'ValidationError') {
                statusCode = 400;
                errorMessage = 'Data validation failed';
            }

            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Get all articles
     */
    async getAllArticles(req, res) {
        try {
            const { source, isUpdated, sort = '-createdAt' } = req.query;

            // Build filter
            const filter = {};
            if (source) filter.source = source;
            if (isUpdated !== undefined) filter.isUpdated = isUpdated === 'true';

            // Pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Get total count
            const total = await Article.countDocuments(filter);

            // Get articles
            const articles = await Article.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-__v');

            res.status(200).json({
                success: true,
                count: articles.length,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                data: articles,
            });
        } catch (error) {
            console.error('Error getting articles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching articles',
                error: error.message,
            });
        }
    }

    /**
     * Get single article by ID
     */
    async getArticleById(req, res) {
        try {
            const article = await Article.findById(req.params.id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
            }

            res.status(200).json({
                success: true,
                data: article,
            });
        } catch (error) {
            console.error('Error getting article:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching article',
                error: error.message,
            });
        }
    }

    /**
     * Create new article (manual)
     */
    async createArticle(req, res) {
        try {
            const article = new Article({
                ...req.body,
                source: req.body.source || 'original',
            });

            await article.save();

            res.status(201).json({
                success: true,
                message: 'Article created successfully',
                data: article,
            });
        } catch (error) {
            console.error('Error creating article:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating article',
                error: error.message,
            });
        }
    }

    /**
     * Update article
     */
    async updateArticle(req, res) {
        try {
            const article = await Article.findByIdAndUpdate(
                req.params.id,
                { ...req.body, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Article updated successfully',
                data: article,
            });
        } catch (error) {
            console.error('Error updating article:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating article',
                error: error.message,
            });
        }
    }

    /**
     * Delete article
     */
    async deleteArticle(req, res) {
        try {
            const article = await Article.findByIdAndDelete(req.params.id);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Article deleted successfully',
                data: article,
            });
        } catch (error) {
            console.error('Error deleting article:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting article',
                error: error.message,
            });
        }
    }

    /**
     * Get scraping status
     */
    async getScrapingStatus(req, res) {
        try {
            const totalArticles = await Article.countDocuments();
            const originalArticles = await Article.countDocuments({ source: 'original' });
            const updatedArticles = await Article.countDocuments({ source: 'ai-updated' });

            res.status(200).json({
                success: true,
                data: {
                    totalArticles,
                    originalArticles,
                    updatedArticles,
                    needsScraping: originalArticles < 5,
                    status: originalArticles >= 5 ? 'Complete' : 'Incomplete',
                },
            });
        } catch (error) {
            console.error('Error getting scraping status:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting scraping status',
                error: error.message,
            });
        }
    }
}

module.exports = new ArticleController();