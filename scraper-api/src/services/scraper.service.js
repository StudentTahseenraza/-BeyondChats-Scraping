const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'https://beyondchats.com/blogs/';
        this.limit = parseInt(process.env.SCRAPE_LIMIT) || 5;
    }

    /**
     * Get the last page number from pagination
     */
    async getLastPageNumber() {
        try {
            const response = await axios.get(this.baseUrl);
            const $ = cheerio.load(response.data);

            // Find pagination links
            const paginationLinks = $('.page-numbers a, .pagination a');
            let lastPage = 1;

            paginationLinks.each((index, element) => {
                const text = $(element).text();
                const pageNum = parseInt(text);
                if (!isNaN(pageNum) && pageNum > lastPage) {
                    lastPage = pageNum;
                }
            });

            console.log(`📄 Found last page: ${lastPage}`);
            return lastPage;
        } catch (error) {
            console.error('❌ Error getting last page:', error.message);
            return 1;
        }
    }

    /**
     * Scrape article listings from a specific page
     */
    async scrapePage(pageNumber) {
        try {
            const url = pageNumber === 1
                ? this.baseUrl
                : `${this.baseUrl}page/${pageNumber}/`;

            console.log(`🔍 Scraping article listings from: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            const articles = [];

            // Look for article links in the posts grid
            $('.elementor-post, .post, article').each((index, element) => {
                const $element = $(element);

                // Find the title link
                const titleLink = $element.find('.elementor-post__title a, .entry-title a, h2 a, h3 a').first();
                const title = titleLink.text().trim();
                let articleUrl = titleLink.attr('href');

                if (!articleUrl) {
                    // Try to find any link in the post
                    articleUrl = $element.find('a').first().attr('href');
                }

                if (title && articleUrl && articleUrl.includes('/blogs/')) {
                    // Make sure URL is absolute
                    if (!articleUrl.startsWith('http')) {
                        if (articleUrl.startsWith('/')) {
                            const urlObj = new URL(this.baseUrl);
                            articleUrl = `${urlObj.origin}${articleUrl}`;
                        } else {
                            articleUrl = `${this.baseUrl}${articleUrl}`;
                        }
                    }

                    // Get excerpt if available
                    const excerpt = $element.find('.elementor-post__excerpt, .post-excerpt, .entry-summary').text().trim();

                    articles.push({
                        title,
                        originalUrl: articleUrl,
                        excerpt: excerpt.substring(0, 200),
                        page: pageNumber,
                        order: index + 1,
                    });

                    console.log(`📰 Found article: "${title}"`);
                }
            });

            return articles.slice(0, this.limit);
        } catch (error) {
            console.error(`❌ Error scraping page ${pageNumber}:`, error.message);
            return [];
        }
    }

    /**
     * Scrape full article content - FIXED VERSION
     * Targets Elementor-specific structure of BeyondChats
     */
    async scrapeArticleContent(articleUrl) {
        try {
            console.log(`\n📄 Scraping FULL ARTICLE from: ${articleUrl}`);

            const response = await axios.get(articleUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);

            // ===== STEP 1: REMOVE COMMENTS AND UNWANTED SECTIONS =====
            $('.ct-comments, #comments, .comment, .comment-list, .comment-respond, .comment-form, #respond, .elementor-widget-post-comments, .post-comments').remove();

            // Also remove any element containing comment text
            $('*').each((index, element) => {
                const $el = $(element);
                const text = $el.text().toLowerCase();
                if (text.includes('leave a reply') || text.includes('cancel reply')) {
                    $el.remove();
                }
            });

            // ===== STEP 2: FIND MAIN ARTICLE CONTENT =====
            // Based on debug output, the main content is in specific Elementor widgets

            let articleHTML = '';
            let articleText = '';
            let mainContentElement = null;

            // Priority 1: Look for the specific Elementor post content widget
            const contentElements = $('[class*="elementor-widget-theme-post-content"], [class*="post-content"]');

            console.log(`🔍 Found ${contentElements.length} potential content elements`);

            // Find the element that contains the actual article (not comments)
            contentElements.each((index, element) => {
                const $el = $(element);
                const text = $el.text().trim();

                // Check if this looks like article content (not comments)
                if (text.length > 500 &&
                    !text.toLowerCase().includes('very well written') &&
                    !text.toLowerCase().includes('comment') &&
                    !text.toLowerCase().includes('reply')) {

                    mainContentElement = $el;
                    console.log(`✅ Found main article content element (${text.length} chars)`);
                    return false; // Break the loop
                }
            });

            // Priority 2: If not found, look for element with actual article text
            if (!mainContentElement) {
                console.log('⚠️ Using alternative content detection');

                // Look for the element containing the article title
                const title = $('h1').first().text().trim();
                if (title) {
                    // Find element that contains this title and has substantial text
                    $('*').each((index, element) => {
                        const $el = $(element);
                        const text = $el.text();

                        if (text.includes(title) && text.length > 1000) {
                            mainContentElement = $el;
                            console.log(`✅ Found content via title match (${text.length} chars)`);
                            return false;
                        }
                    });
                }
            }

            // Priority 3: Extract from the post-content container
            if (!mainContentElement) {
                const postContent = $('.post-content, .entry-content, .article-content').first();
                if (postContent.length > 0) {
                    mainContentElement = postContent;
                    console.log(`✅ Found content via .post-content selector`);
                }
            }

            // ===== STEP 3: EXTRACT AND CLEAN CONTENT =====
            if (mainContentElement) {
                const $content = $(mainContentElement).clone();

                // Clean up the content
                $content.find('script, style, iframe, .social-share, .share-buttons, .author-box, .related-posts, .post-navigation').remove();

                // Get HTML and text
                articleHTML = $content.html();
                articleText = $content.text()
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n\n')
                    .trim();

                console.log(`📊 Extracted ${articleText.length} characters of article content`);
            } else {
                console.log('⚠️ Could not find main content element, using fallback');

                // Fallback: Extract all text and remove comments
                let allText = $('body').text();

                // Remove comment sections
                const lines = allText.split('\n');
                const articleLines = [];
                let skipMode = false;

                for (let line of lines) {
                    const trimmedLine = line.trim().toLowerCase();

                    // Skip comment sections
                    if (trimmedLine.includes('comments') || trimmedLine.includes('leave a reply')) {
                        skipMode = true;
                    }

                    if (trimmedLine === '' || trimmedLine.includes('related posts') || trimmedLine.includes('share on')) {
                        skipMode = false;
                    }

                    if (!skipMode && trimmedLine.length > 20 &&
                        !trimmedLine.includes('very well written') &&
                        !trimmedLine.includes('april 3, 2025') &&
                        !trimmedLine.includes('reply')) {
                        articleLines.push(line.trim());
                    }
                }

                articleText = articleLines.join('\n\n');
                articleHTML = `<div class="article-content"><p>${articleLines.join('</p><p>')}</p></div>`;
            }

            // ===== STEP 4: CLEAN UP THE TEXT =====
            // Remove any remaining comment references
            articleText = articleText
                .replace(/leave a comment/gi, '')
                .replace(/comments are closed/gi, '')
                .replace(/\d+\s*comments?/gi, '')
                .replace(/reply\s*$/gi, '')
                .replace(/very well written/gi, '')
                .replace(/april 3, 2025\s*\/\s*12:16 am/gi, '')
                .replace(/\s{3,}/g, '  ')
                .trim();

            // ===== EXTRACT IMAGES (WITH SOCIAL MEDIA FILTER) =====
            const images = [];
            if (articleHTML) {
                const $article = cheerio.load(articleHTML);

                $article('img').each((i, img) => {
                    let src = $article(img).attr('src');
                    const alt = ($article(img).attr('alt') || '').toLowerCase();
                    const classAttr = ($article(img).attr('class') || '').toLowerCase();

                    if (src) {
                        // Convert relative URLs
                        if (src.startsWith('/')) {
                            const urlObj = new URL(articleUrl);
                            src = `${urlObj.origin}${src}`;
                        }

                        // ===== CHECK IF IT'S A SOCIAL MEDIA/ICON IMAGE =====
                        const isSocialIcon =
                            // Check URL patterns
                            src.includes('twitter') ||
                            src.includes('x.com') ||
                            src.includes('facebook') ||
                            src.includes('linkedin') ||
                            src.includes('whatsapp') ||
                            src.includes('instagram') ||
                            src.includes('pinterest') ||
                            // Check for social/share in URL
                            src.includes('social') ||
                            src.includes('share') ||
                            src.includes('icon') ||
                            // Check alt text
                            alt.includes('twitter') ||
                            alt.includes('facebook') ||
                            alt.includes('linkedin') ||
                            alt.includes('whatsapp') ||
                            alt.includes('instagram') ||
                            alt.includes('social') ||
                            alt.includes('share') ||
                            alt.includes('icon') ||
                            alt.includes('logo') ||
                            // Check class names
                            classAttr.includes('social') ||
                            classAttr.includes('share') ||
                            classAttr.includes('icon') ||
                            classAttr.includes('elementor-share-btn');

                        // Skip if it's a social icon
                        if (!isSocialIcon) {
                            images.push({
                                url: src,
                                alt: $article(img).attr('alt') || '',
                                caption: $article(img).closest('figcaption').text() || ''
                            });
                        }
                    }
                });

                console.log(`📸 Found ${images.length} images (social icons filtered out)`);
            }

            // Also, add this to clean social share buttons from HTML:
            // After extracting images but before returning, clean the HTML:

            // Remove social share buttons from HTML content
            const $clean = cheerio.load(articleHTML);
            $clean('.social-share, .share-buttons, [class*="share"], [class*="social"], .elementor-share-buttons').remove();

            // Also remove social media links
            $clean('a').each((i, el) => {
                const $el = $clean(el);
                const href = $el.attr('href') || '';
                const text = $el.text().toLowerCase();

                if (href.includes('twitter.com') ||
                    href.includes('facebook.com') ||
                    href.includes('linkedin.com') ||
                    href.includes('whatsapp.com') ||
                    text.includes('share') ||
                    text.includes('tweet') ||
                    text.includes('like')) {
                    $el.remove();
                }
            });

            articleHTML = $clean.html();

            // ===== STEP 6: EXTRACT PUBLISHED DATE =====
            let publishedDate = new Date();
            const dateText = $('.elementor-post-info, .post-date, .published, .entry-date').text();

            if (dateText) {
                // Try to parse date from text
                const dateMatch = dateText.match(/(\w+\s+\d{1,2},?\s+\d{4})|(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    const parsedDate = new Date(dateMatch[0]);
                    if (!isNaN(parsedDate.getTime())) {
                        publishedDate = parsedDate;
                    }
                }
            }

            console.log(`✅ FINAL: ${articleText.length} characters, ${images.length} images`);

            // Show preview
            if (articleText.length > 0) {
                const preview = articleText.substring(0, 200).replace(/\n/g, ' ');
                console.log(`📋 Preview: ${preview}...`);
            }

            return {
                htmlContent: articleHTML || '<div class="article-content"><p>Article content not available</p></div>',
                textContent: articleText || 'Article content not available',
                images: images,
                publishedDate: publishedDate
            };

        } catch (error) {
            console.error(`❌ Error scraping article:`, error.message);
            return {
                htmlContent: '<div class="article-content"><p>Error fetching article content</p></div>',
                textContent: `Error: ${error.message}`,
                images: [],
                publishedDate: new Date()
            };
        }
    }

    /**
     * Main scraping function
     */
    async scrapeOldestArticles() {
        try {
            console.log('🚀 Starting BeyondChats article scraper...');
            console.log('📌 Target: 5 OLDEST articles with REAL content (not comments)\n');

            // Get last page
            const lastPage = await this.getLastPageNumber();
            console.log(`📄 Starting from last page: ${lastPage}\n`);

            const allArticles = [];
            let currentPage = lastPage;

            // Get article listings
            while (allArticles.length < this.limit && currentPage > 0) {
                console.log(`\n📑 Checking page ${currentPage}...`);
                const pageArticles = await this.scrapePage(currentPage);

                for (const article of pageArticles) {
                    if (allArticles.length < this.limit) {
                        const exists = allArticles.some(a => a.originalUrl === article.originalUrl);
                        if (!exists) {
                            allArticles.push(article);
                            console.log(`   ✅ Added: ${article.title}`);
                        }
                    }
                }

                currentPage--;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`\n🎯 Found ${allArticles.length} article listings`);
            console.log('⏳ Now scraping full article content...\n');

            // Scrape full content
            const articlesWithContent = [];
            for (let i = 0; i < allArticles.length; i++) {
                const article = allArticles[i];
                console.log(`\n[${i + 1}/${allArticles.length}] "${article.title}"`);

                const content = await this.scrapeArticleContent(article.originalUrl);

                articlesWithContent.push({
                    ...article,
                    originalContent: content.htmlContent,
                    originalText: content.textContent,
                    images: content.images,
                    publishedDate: content.publishedDate,
                    scrapedAt: new Date()
                });

                if (i < allArticles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            // Summary
            console.log('\n' + '='.repeat(70));
            console.log('✅ SCRAPING COMPLETE - REAL ARTICLE CONTENT (NOT COMMENTS)');
            console.log('='.repeat(70));

            let successCount = 0;
            articlesWithContent.forEach((article, i) => {
                const hasContent = article.originalText && article.originalText.length > 500;
                console.log(`\n${i + 1}. ${hasContent ? '✅' : '⚠️'} "${article.title}"`);
                console.log(`   📏 Length: ${article.originalText.length} chars`);
                console.log(`   🖼️ Images: ${article.images.length}`);
                console.log(`   🔗 ${article.originalUrl}`);

                if (hasContent) {
                    successCount++;
                    // Check if content looks like article (not comments)
                    const text = article.originalText.toLowerCase();
                    const isArticle = text.includes('ai') || text.includes('patient') || text.includes('healthcare');
                    console.log(`   📰 Looks like article: ${isArticle ? 'YES' : 'MAYBE'}`);

                    if (isArticle && article.originalText.length > 0) {
                        const preview = article.originalText.substring(0, 150).replace(/\n/g, ' ');
                        console.log(`   📋 Preview: ${preview}...`);
                    }
                } else {
                    console.log(`   ⚠️ WARNING: Content seems short, might be comments`);
                }
            });

            console.log(`\n📊 Summary: ${successCount}/${articlesWithContent.length} articles have substantial content`);

            return articlesWithContent;

        } catch (error) {
            console.error('❌ Error in scrapeOldestArticles:', error.message);
            throw error;
        }
    }
}

module.exports = new ScraperService();