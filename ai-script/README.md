# 🚀 Phase 2: AI Automation Script

## 📋 Overview
This script automates the enhancement of BeyondChats articles using AI. It:
1. Fetches original articles from Phase 1 API
2. Searches Google for similar articles
3. Scrapes competitor articles
4. Uses OpenAI to enhance the original article
5. Saves the enhanced article with references

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│ Phase 1 Backend API │
│ (http://localhost:5000) │
└───────────────────────────┬─────────────────────────────────┘
│
┌───────────────────────────▼─────────────────────────────────┐
│ AI Automation Script │
│ ├──────────────────────────────────────────────────────┤ │
│ │ 1. Fetch Articles → GET /api/articles │ │
│ │ 2. Google Search → Puppeteer │ │
│ │ 3. Scrape Competitors → Cheerio │ │
│ │ 4. AI Enhancement → OpenAI API │ │
│ │ 5. Save Enhanced → PUT /api/articles/:id │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

text

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js v18 or higher
- Phase 1 backend running on http://localhost:5000
- OpenAI API key

### 2. Installation
```bash
cd ai-script
npm install
3. Configuration
Copy .env.example to .env and update:

env
# Required
OPENAI_API_KEY=your_openai_api_key_here
BACKEND_API_URL=http://localhost:5000/api

# Optional configurations
OPENAI_MODEL=gpt-4-turbo-preview
MAX_ARTICLES_TO_PROCESS=5
4. Test Setup
bash
# Test Phase 1 connection
node test-script.js

# Run all tests
npm run test
🚀 Usage
Process All Articles
bash
npm start
# or
npm run process
# or
node src/index.js --process-all
Process Single Article
bash
# Get article ID from Phase 1 API
npm run single -- --article-id=<ARTICLE_ID>
# or
node src/index.js --article-id=<ARTICLE_ID>
Run Tests Only
bash
npm run test
# or
node src/index.js --test
Get Help
bash
node src/index.js --help
📊 Output
The script will:

Log progress to console with colors

Save detailed logs to logs/ directory

Generate processing reports in logs/reports/

Update articles in the database with:

updatedContent: AI-enhanced version

references: Competitor article URLs

source: Changed to 'ai-updated'

isUpdated: Set to true

🔧 Components
1. API Client (src/services/api-client.js)
Fetches articles from Phase 1 backend

Updates articles with enhanced content

2. Google Search (src/services/google-search.js)
Uses Puppeteer for browser automation

Searches article titles on Google

Filters out BeyondChats and irrelevant results

3. Content Scraper (src/services/content-scraper.js)
Scrapes competitor articles using Cheerio

Extracts main content while removing ads/navigation

Validates content quality

4. OpenAI Service (src/services/openai-service.js)
Enhances articles using GPT-4

Adds proper formatting and structure

Includes references section

5. Processor (src/services/processor.js)
Orchestrates the entire workflow

Handles error recovery

Generates processing reports

🐛 Troubleshooting
Common Issues:
Cannot connect to backend API

bash
# Ensure Phase 1 server is running
cd ../scraper-api
npm run dev
OpenAI API key not working

bash
# Verify your API key at https://platform.openai.com/api-keys
# Check .env file has correct key
Google blocking requests

The script includes delays between requests

Uses realistic user agent

Consider adding proxy support if needed

Puppeteer fails to launch

bash
# Install missing dependencies
npm install puppeteer
# Or use puppeteer-core with existing Chrome
Debug Mode:
bash
# Set debug logging
export LOG_LEVEL=debug
npm start
📝 Notes
The script respects rate limits with configurable delays

Each article enhancement costs OpenAI tokens (~$0.01-0.10 per article)

Enhanced articles include competitor references at the bottom

Original content is preserved in originalContent field

Processing can be resumed if interrupted

✅ Verification
After running the script, verify:

Check Phase 1 API for updated articles:

bash
curl http://localhost:5000/api/articles?source=ai-updated
View enhanced content:

bash
curl http://localhost:5000/api/articles/<article-id>
Check references are included at bottom of updatedContent

text

### **🔹 STEP 13: Create .env.example**

Create `ai-script/.env.example`:

```env
# API Configuration
BACKEND_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration - REQUIRED
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Google Search Configuration
GOOGLE_SEARCH_URL=https://www.google.com/search
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

# Script Configuration
MAX_ARTICLES_TO_PROCESS=5
MAX_GOOGLE_RESULTS=5
COMPETITOR_ARTICLES_TO_FETCH=2
MIN_ARTICLE_LENGTH=500
MAX_ARTICLE_LENGTH=5000
REQUEST_DELAY_MS=2000
TIMEOUT_MS=30000

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=./logs