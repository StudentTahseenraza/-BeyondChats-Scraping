// Add this to your article.routes.js temporarily
router.get('/test-scraper', async (req, res) => {
    try {
        const scrapedArticles = await scraperService.scrapeOldestArticles();
        res.json({
            success: true,
            count: scrapedArticles.length,
            firstArticle: scrapedArticles[0] ? {
                title: scrapedArticles[0].title,
                url: scrapedArticles[0].originalUrl,
                hasContent: !!scrapedArticles[0].originalContent,
                contentLength: scrapedArticles[0].originalContent?.length,
                imagesCount: scrapedArticles[0].images?.length
            } : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});