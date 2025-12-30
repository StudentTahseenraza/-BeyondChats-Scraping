const axios = require('axios');

async function testPhase1API() {
  console.log('Testing Phase 1 API Connection...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', health.data);
    
    // Test 2: Get articles
    console.log('\n2. Getting articles...');
    const articles = await axios.get('http://localhost:5000/api/articles');
    console.log(`✅ Found ${articles.data.count} articles`);
    
    if (articles.data.data.length > 0) {
      console.log('Sample article:', {
        id: articles.data.data[0]._id,
        title: articles.data.data[0].title,
        source: articles.data.data[0].source,
        isUpdated: articles.data.data[0].isUpdated,
      });
      
      // Test 3: Check for unprocessed articles
      const unprocessed = articles.data.data.filter(a => !a.isUpdated && a.source === 'original');
      console.log(`\n3. Found ${unprocessed.length} unprocessed articles`);
      
      return {
        success: true,
        totalArticles: articles.data.count,
        unprocessedArticles: unprocessed.length,
        sampleArticleId: unprocessed.length > 0 ? unprocessed[0]._id : null,
      };
    }
    
    return { success: false, message: 'No articles found' };
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('PHASE 2 PRE-TEST: Verifying Phase 1 Setup');
  console.log('='.repeat(60));
  
  const result = await testPhase1API();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ Phase 1 API is working correctly');
    console.log(`📊 Total articles: ${result.totalArticles}`);
    console.log(`🔄 Unprocessed articles: ${result.unprocessedArticles}`);
    
    if (result.sampleArticleId) {
      console.log(`🔗 Sample article ID for testing: ${result.sampleArticleId}`);
      console.log('\nTo test Phase 2 with this article, run:');
      console.log(`npm run single -- --article-id=${result.sampleArticleId}`);
    }
  } else {
    console.log('❌ Phase 1 API is not accessible');
    console.log('Make sure the Phase 1 server is running on http://localhost:5000');
  }
}

runTests();