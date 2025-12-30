
const logger = require('../utils/logger');

class ContentFormatter {
  constructor() {
    logger.info('✅ Content formatter initialized');
  }

  formatEnhancedContent(content) {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

    logger.debug('Formatting enhanced content...');
    
    let formatted = content;
    
    // Step 1: Clean up the content
    formatted = this.cleanContent(formatted);
    
    // Step 2: Fix heading hierarchy
    formatted = this.fixHeadings(formatted);
    
    // Step 3: Format lists and bullet points
    formatted = this.formatLists(formatted);
    
    // Step 4: Format paragraphs
    formatted = this.formatParagraphs(formatted);
    
    // Step 5: Add spacing for readability
    formatted = this.addSpacing(formatted);
    
    logger.debug(`Formatted content: ${formatted.length} chars`);
    
    return formatted;
  }

  cleanContent(content) {
    let cleaned = content;
    
    // Remove AI enhancement notice if present
    cleaned = cleaned.replace(/AI Enhancement[\s\S]*?original message\.\s*/i, '');
    cleaned = cleaned.replace(/This content has been enhanced using[\s\S]*?original message\.\s*/i, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    return cleaned.trim();
  }

  fixHeadings(content) {
    let withHeadings = content;
    
    // Convert various heading formats to proper markdown
    withHeadings = withHeadings.replace(/###\s+(.*?)\n/g, '## $1\n\n');
    withHeadings = withHeadings.replace(/####\s+(.*?)\n/g, '### $1\n\n');
    
    // Ensure H1 at the beginning if not present
    if (!withHeadings.startsWith('# ')) {
      const firstLine = withHeadings.split('\n')[0];
      if (firstLine && !firstLine.startsWith('##') && !firstLine.startsWith('###')) {
        withHeadings = `# ${firstLine}\n\n${withHeadings.substring(firstLine.length)}`;
      }
    }
    
    return withHeadings;
  }

  formatLists(content) {
    let withLists = content;
    
    // Convert numbered lists
    withLists = withLists.replace(/^\d+\)\s+(.*)$/gm, '1. $1');
    withLists = withLists.replace(/^\(\d+\)\s+(.*)$/gm, '1. $1');
    
    // Convert bullet points to consistent format
    withLists = withLists.replace(/^[-*•]\s+(.*)$/gm, '• $1');
    
    // Add spacing around lists
    withLists = withLists.replace(/(\n)(• .*\n)+/g, (match, before, list) => {
      return `${before}\n${list}\n`;
    });
    
    // Format numbered lists with proper indentation
    withLists = withLists.replace(/(\n)(\d+\..*\n)+/g, (match, before, list) => {
      return `${before}\n${list}\n`;
    });
    
    return withLists;
  }

  formatParagraphs(content) {
    let withParagraphs = content;
    
    // Split into paragraphs (2-4 sentences each)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let paragraphs = [];
    let currentParagraph = [];
    
    for (let i = 0; i < sentences.length; i++) {
      currentParagraph.push(sentences[i].trim() + '.');
      
      // Start new paragraph every 2-4 sentences
      if (currentParagraph.length >= 2 && (i === sentences.length - 1 || Math.random() > 0.6)) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    }
    
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }
    
    // Reconstruct with proper paragraph breaks
    withParagraphs = paragraphs.join('\n\n');
    
    return withParagraphs;
  }

  addSpacing(content) {
    let withSpacing = content;
    
    // Ensure spacing after headings
    withSpacing = withSpacing.replace(/^(#{1,3} .*)$/gm, '$1\n');
    
    // Ensure spacing before and after lists
    withSpacing = withSpacing.replace(/(\n\n)(• .*\n)+/g, '\n\n$&');
    withSpacing = withSpacing.replace(/(\n\n)(\d+\..*\n)+/g, '\n\n$&');
    
    // Remove excessive blank lines
    withSpacing = withSpacing.replace(/\n{3,}/g, '\n\n');
    
    return withSpacing.trim();
  }

  formatForWebDisplay(content) {
    // Convert markdown to HTML for web display
    let html = content;
    
    // Headings
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    
    // Lists
    html = html.replace(/^• (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n)+/g, (match) => {
      return '<ol>' + match + '</ol>';
    });
    
    // Paragraphs
    const lines = html.split('\n');
    let inParagraph = false;
    let result = [];
    
    for (let line of lines) {
      if (line.trim() === '' || 
          line.startsWith('<h') || 
          line.startsWith('<ul') || 
          line.startsWith('<ol') || 
          line.startsWith('</ul') || 
          line.startsWith('</ol') || 
          line.startsWith('<li>')) {
        if (inParagraph) {
          result.push('</p>');
          inParagraph = false;
        }
        result.push(line);
      } else {
        if (!inParagraph) {
          result.push('<p>');
          inParagraph = true;
        }
        result.push(line);
      }
    }
    
    if (inParagraph) {
      result.push('</p>');
    }
    
    html = result.join('\n');
    
    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/\n{3,}/g, '\n\n');
    
    return html;
  }
}

module.exports = new ContentFormatter();
