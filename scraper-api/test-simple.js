require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

async function testSimple() {
    const url = 'https://beyondchats.com/blogs/will-ai-understand-the-complexities-of-patient-care/';
    
    console.log('Testing direct access to article...\n');
    
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        console.log('Page title:', $('title').text());
        
        // Look for article content
        console.log('\nSearching for content...');
        
        // Check different selectors
        const selectors = [
            'article',
            'main',
            '.post',
            '.single-post',
            '.entry',
            '.content',
            '.blog-content'
        ];
        
        selectors.forEach(selector => {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`\nFound with ${selector}:`);
                const text = elements.first().text().substring(0, 300).replace(/\n/g, ' ');
                console.log(text);
            }
        });
        
        // Look for any div with class containing "content"
        console.log('\nLooking for divs with "content" in class...');
        $('div[class*="content"]').each((i, el) => {
            const $el = $(el);
            const classes = $el.attr('class');
            const text = $el.text().substring(0, 200).replace(/\n/g, ' ');
            if (text.length > 50) {
                console.log(`\nDiv classes: ${classes}`);
                console.log(`Text: ${text}...`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSimple();