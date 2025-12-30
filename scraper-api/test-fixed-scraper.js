require('dotenv').config();
const scraperService = require('./src/services/scraper.service');

async function testFixedScraper() {
    console.log('🧪 TESTING FIXED SCRAPER - Should get REAL article content\n');
    
    // Test with the exact URL from your screenshot
    const testUrl = 'https://beyondchats.com/blogs/will-ai-understand-the-complexities-of-patient-care/';
    
    console.log(`🔗 Testing: ${testUrl}\n`);
    
    try {
        const content = await scraperService.scrapeArticleContent(testUrl);
        
        console.log('='.repeat(70));
        console.log('📊 RESULTS:');
        console.log('='.repeat(70));
        console.log(`Content Length: ${content.textContent.length} characters`);
        console.log(`Images Found: ${content.images.length}`);
        console.log(`Published Date: ${content.publishedDate.toDateString()}`);
        
        console.log('\n' + '='.repeat(70));
        console.log('🔍 CONTENT ANALYSIS:');
        console.log('='.repeat(70));
        
        // Check what we got
        const text = content.textContent.toLowerCase();
        
        const checks = [
            { name: 'Contains "Artificial intelligence"', check: text.includes('artificial intelligence') },
            { name: 'Contains "patient care"', check: text.includes('patient care') },
            { name: 'Contains "healthcare"', check: text.includes('healthcare') },
            { name: 'Contains "Very well written" (COMMENTS)', check: text.includes('very well written') },
            { name: 'Contains "Pankaj" (COMMENTER)', check: text.includes('pankaj') },
            { name: 'Contains "April 3, 2025" (COMMENT DATE)', check: text.includes('april 3, 2025') },
            { name: 'Contains "Reply" (COMMENTS)', check: text.includes('reply') },
            { name: 'Substantial content (>500 chars)', check: content.textContent.length > 500 }
        ];
        
        let passed = 0;
        checks.forEach(check => {
            const isGood = check.name.includes('COMMENT') ? !check.check : check.check;
            console.log(`${isGood ? '✅' : '❌'} ${check.name}: ${check.check}`);
            if (isGood) passed++;
        });
        
        console.log(`\n📈 Score: ${passed}/${checks.length} checks passed`);
        
        console.log('\n' + '='.repeat(70));
        console.log('📝 CONTENT PREVIEW (first 500 chars):');
        console.log('='.repeat(70));
        if (content.textContent.length > 0) {
            console.log(content.textContent.substring(0, 500) + '...');
        } else {
            console.log('No content found');
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('🖼️ IMAGES FOUND:');
        console.log('='.repeat(70));
        content.images.forEach((img, i) => {
            console.log(`${i + 1}. ${img.url}`);
            if (img.alt) console.log(`   Alt: ${img.alt}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFixedScraper();