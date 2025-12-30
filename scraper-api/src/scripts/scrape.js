require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const scraperService = require('../services/scraper.service');
const Article = require('../models/Article');

async function runScraping() {
  try {
    console.log('🚀 Starting standalone scraping script...');
    
    // Connect to database
    await connectDB();
    
    // Check existing articles
    const existingCount = await Article.countDocuments({ source: 'original' });
    console.log(`📊 Existing articles in DB: ${existingCount}`);
    
    if (existingCount >= 5) {
      console.log('✅ Already have 5 articles. No need to scrape.');
      console.log('📋 Here are the existing articles:');
      
      const articles = await Article.find({ source: 'original' })
        .sort({ createdAt: -1 })
        .select('title originalUrl scrapedAt slug')
        .limit(5);
      
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   URL: ${article.originalUrl}`);
        console.log(`   Scraped: ${article.scrapedAt}`);
        console.log('');
      });
      
      await mongoose.connection.close();
      return;
    }
    
    // Run scraping
    const articlesToScrape = 5 - existingCount;
    console.log(`🔍 Need to scrape ${articlesToScrape} more articles`);
    
    const scrapedArticles = await scraperService.scrapeOldestArticles();
    
    // Save to database
    let savedCount = 0;
    for (const scrapedArticle of scrapedArticles) {
      // Generate slug
      const slug = scrapedArticle.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Check if article already exists
      const exists = await Article.findOne({ 
        $or: [
          { originalUrl: scrapedArticle.originalUrl },
          { slug: slug }
        ]
      });
      
      if (!exists) {
        const article = new Article({
          title: scrapedArticle.title,
          slug: slug,
          originalContent: scrapedArticle.originalContent,
          originalUrl: scrapedArticle.originalUrl,
          source: 'original',
          publishedDate: new Date(),
          scrapedAt: new Date(),
        });
        
        await article.save();
        savedCount++;
        console.log(`✅ Saved: ${scrapedArticle.title}`);
        console.log(`   Slug: ${slug}`);
      } else {
        console.log(`⏭️ Skipping (already exists): ${scrapedArticle.title}`);
      }
    }
    
    console.log(`\n🎉 Scraping completed! Saved ${savedCount} new articles`);
    console.log(`📊 Total articles in DB: ${await Article.countDocuments()}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Script completed successfully');
    
  } catch (error) {
    console.error('❌ Error in scraping script:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

runScraping();