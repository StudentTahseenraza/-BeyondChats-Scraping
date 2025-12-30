
const axios = require('axios');
require('dotenv').config();

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in .env file');
    console.log('Get a free key from: https://openrouter.ai');
    return;
  }
  
  console.log('🔧 Testing OpenRouter with different free models...\n');
  
  const models = [
    'microsoft/phi-3-medium-4k-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'huggingfaceh4/zephyr-7b-beta:free',
    'Qwen/Qwen2.5-32B-Instruct:free'
  ];
  
  for (const model of models) {
    console.log(`Testing: ${model}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: "user",
              content: "Hello, are you working? Just say 'YES'."
            }
          ],
          max_tokens: 5,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://test.com',
          },
          timeout: 20000, // 20 second timeout
        }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const answer = response.data.choices[0]?.message?.content || 'No response';
      
      console.log(`✅ SUCCESS (${responseTime}ms): ${answer}`);
      console.log(`   👉 This model works! Set in .env: OPENROUTER_MODEL=${model}\n`);
      return; // Stop after first success
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      if (error.response?.data?.error) {
        console.log(`   Error details: ${JSON.stringify(error.response.data.error, null, 2)}`);
      }
      console.log();
    }
  }
  
  console.log('❌ All models failed. Possible issues:');
  console.log('1. Check your API key at: https://openrouter.ai/keys');
  console.log('2. Make sure you have free credits');
  console.log('3. Try again in a few minutes (servers might be busy)');
}

testOpenRouter();
