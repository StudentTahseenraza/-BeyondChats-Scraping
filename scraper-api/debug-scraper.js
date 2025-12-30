require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function debugScraper() {
    const testUrl = 'https://beyondchats.com/blogs/will-ai-understand-the-complexities-of-patient-care/';
    
    console.log('🔍 DEBUG: Analyzing BeyondChats website structure\n');
    
    try {
        // First, let's see the raw HTML structure
        const response = await axios.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        
        console.log('='.repeat(80));
        console.log('📄 PAGE TITLE:');
        console.log('='.repeat(80));
        console.log($('title').text());
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 CHECKING ARTICLE STRUCTURE:');
        console.log('='.repeat(80));
        
        // Check for common article containers
        const containers = [
            'article',
            'main',
            '.post',
            '.blog-post',
            '.single-post',
            '.entry',
            '.content-area',
            '.site-content',
            '#content',
            '#main',
            '.post-content',
            '.entry-content',
            '.article-content'
        ];
        
        containers.forEach(selector => {
            const elements = $(selector);
            console.log(`${selector}: ${elements.length} found`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 SPECIFIC CONTENT AREAS:');
        console.log('='.repeat(80));
        
        // Look for specific divs with classes that might contain content
        $('div[class*="content"], div[class*="post"], div[class*="entry"], div[class*="article"]').each((i, el) => {
            const $el = $(el);
            const classes = $el.attr('class') || '';
            const id = $el.attr('id') || '';
            
            if (classes.includes('content') || classes.includes('post') || 
                classes.includes('entry') || classes.includes('article') ||
                id.includes('content') || id.includes('post')) {
                
                const text = $el.text().substring(0, 200).replace(/\n/g, ' ').trim();
                console.log(`\n📦 Element: class="${classes}" id="${id}"`);
                console.log(`   Text preview: ${text}...`);
            }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 ALL DIV CLASSES ON PAGE:');
        console.log('='.repeat(80));
        
        // Get all unique div classes
        const allClasses = new Set();
        $('div[class]').each((i, el) => {
            const classes = $(el).attr('class').split(' ');
            classes.forEach(cls => allClasses.add(cls));
        });
        
        console.log(Array.from(allClasses).sort().join(', '));
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 EXTRACTING HEADINGS (h1, h2, h3):');
        console.log('='.repeat(80));
        
        $('h1, h2, h3').each((i, el) => {
            console.log(`<${el.name}> ${$(el).text().trim()}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('🔍 CHECKING FOR COMMENTS SECTION:');
        console.log('='.repeat(80));
        
        // Look for comments
        const commentSelectors = [
            '#comments',
            '.comments',
            '.comment',
            '.comment-list',
            '.comments-area',
            '[id*="comment"]',
            '[class*="comment"]'
        ];
        
        commentSelectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`${selector}: ${elements.length} found`);
                console.log(`  Text: ${elements.first().text().substring(0, 100)}...`);
            }
        });
        
        // Save HTML for manual inspection
        fs.writeFileSync('debug-page.html', response.data);
        console.log('\n💾 Saved full HTML to debug-page.html for manual inspection');
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
    }
}

debugScraper();