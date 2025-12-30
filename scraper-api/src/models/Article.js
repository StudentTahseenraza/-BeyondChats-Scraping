const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    sparse: true,
  },
  // Store original content as HTML to preserve formatting and images
  originalContent: {
    type: String,
    required: true,
  },
  // Also store as text for search functionality
  originalText: {
    type: String,
    default: '',
  },
  updatedContent: {
    type: String,
    default: null,
  },
  originalUrl: {
    type: String,
    required: true,
    unique: true,
  },
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    enum: ['original', 'ai-updated'],
    default: 'original',
  },
  references: {
    type: [String],
    default: [],
  },
  isUpdated: {
    type: Boolean,
    default: false,
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
  },
  // Store image URLs separately for easy access
  images: [{
    url: String,
    alt: String,
    caption: String,
  }],
}, {
  timestamps: true,
});

// Create indexes
articleSchema.index({ title: 'text', originalText: 'text' });
articleSchema.index({ slug: 1 });
articleSchema.index({ originalUrl: 1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;