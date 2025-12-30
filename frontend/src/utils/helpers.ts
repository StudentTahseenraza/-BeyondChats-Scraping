import { format, formatDistanceToNow } from 'date-fns';

// Format date to readable string
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown time';
  }
};

// // Truncate text with ellipsis
// export const truncateText = (text: string, maxLength: number = 100): string => {
//   if (!text || typeof text !== 'string') return '';
//   if (text.length <= maxLength) return text;
//   return text.substring(0, maxLength) + '...';
// };

// Extract domain from URL
export const getDomainFromUrl = (url: string): string => {
  try {
    if (!url) return '';
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url || '';
  }
};

// Format article content (basic HTML formatting)
export const formatArticleContent = (content: string): string => {
  if (!content || typeof content !== 'string') return '';

  // Convert newlines to paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  return paragraphs.map(p => `<p>${p}</p>`).join('');
};

// Safe HTML rendering function
export const safeHtml = (html: string): { __html: string } => {
  if (!html || typeof html !== 'string') return { __html: '' };

  // Basic sanitization
  let safeHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '');

  return { __html: safeHtml };
};

// Check if article is AI-updated
export const isAIUpdated = (article: any): boolean => {
  if (!article) return false;
  return article.source === 'ai-updated' && article.isUpdated === true;
};

// Format article content for display (returns safe HTML object)
export const formatArticleContentForDisplay = (content: string): { __html: string } => {
  if (!content || typeof content !== 'string') return { __html: '' };

  // If content contains HTML tags, assume it's already formatted
  if (content.includes('<') && content.includes('>')) {
    return safeHtml(content);
  }

  // Otherwise, convert plain text to basic HTML
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('');

  return { __html: htmlContent };
};

// Helper to get article excerpt
export const getArticleExcerpt = (content: string, maxLength: number = 150): string => {
  if (!content || typeof content !== 'string') return '';

  // Remove HTML tags if present
  const textOnly = content.replace(/<[^>]*>/g, ' ');

  // Clean up whitespace
  const cleanText = textOnly.replace(/\s+/g, ' ').trim();

  return truncateText(cleanText, maxLength);
};

// Add this function to strip HTML tags
export function stripHtml(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  const stripped = html.replace(/<[^>]*>?/gm, '');

  // Decode HTML entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = stripped;
  return textArea.value;
}

// Update your truncateText function to handle HTML
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';

  // Strip HTML first
  const cleanText = stripHtml(text);

  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
}

// You might also want a function to get plain text for excerpts
export function getPlainTextExcerpt(html: string, maxLength: number = 150): string {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>?/gm, '');

  // Decode HTML entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  text = textArea.value;

  // Remove multiple spaces and newlines
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatContentAsHtml(markdownContent: string): string {
  if (!markdownContent) return '<p>No content available</p>';

  let html = markdownContent;

  // Convert headings with better styling
  html = html.replace(/^# (.*$)/gim, '<h1 class="article-h1">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="article-h2">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="article-h3">$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="article-h4">$1</h4>');

  // Bold text with better styling
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="article-bold">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="article-bold">$1</strong>');

  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<em class="article-italic">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="article-italic">$1</em>');

  // Convert bullet points to beautiful lists
  html = html.replace(/^•\s+(.*$)/gim, '<li class="article-list-item">$1</li>');
  html = html.replace(/^-\s+(.*$)/gim, '<li class="article-list-item">$1</li>');
  html = html.replace(/^\*\s+(.*$)/gim, '<li class="article-list-item">$1</li>');

  // Handle bullet lists with beautiful styling
  const lines = html.split('\n');
  let result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('<li class="article-list-item">')) {
      if (!inList) {
        result.push('<ul class="article-ul">');
        inList = true;
      }
      result.push(lines[i]);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(lines[i]);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  html = result.join('\n');

  // Convert numbered lists
  html = html.replace(/^\d+\.\s+(.*$)/gim, '<li class="article-list-item">$1</li>');

  // Handle numbered lists
  const numberedLines = html.split('\n');
  result = [];
  let inOrderedList = false;

  for (let i = 0; i < numberedLines.length; i++) {
    if (numberedLines[i].match(/^<li class="article-list-item">.*<\/li>$/)) {
      const content = numberedLines[i].replace(/<\/?li[^>]*>/g, '');
      if (content.match(/^\d+\.\s+.+/)) {
        if (!inOrderedList) {
          result.push('<ol class="article-ol">');
          inOrderedList = true;
        }
        result.push(`<li class="article-list-item">${content.replace(/^\d+\.\s+/, '')}</li>`);
        continue;
      }
    }

    if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }
    result.push(numberedLines[i]);
  }

  if (inOrderedList) {
    result.push('</ol>');
  }

  html = result.join('\n');

  // Handle paragraphs with beautiful styling
  const paraLines = html.split('\n');
  result = [];
  let inParagraph = false;
  let currentParagraph = [];

  for (let line of paraLines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine === '') {
      if (currentParagraph.length > 0) {
        result.push(`<p class="article-paragraph">${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      inParagraph = false;
      continue;
    }

    // If line is a heading, list, or other block element, end paragraph
    if (trimmedLine.startsWith('<h') ||
      trimmedLine.startsWith('<ul') ||
      trimmedLine.startsWith('<ol') ||
      trimmedLine.startsWith('</ul') ||
      trimmedLine.startsWith('</ol') ||
      trimmedLine.startsWith('<li')) {

      if (currentParagraph.length > 0) {
        result.push(`<p class="article-paragraph">${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      inParagraph = false;
      result.push(line);
      continue;
    }

    // Remove any remaining HTML tags for plain text lines
    const cleanLine = trimmedLine.replace(/<[^>]*>/g, '').trim();
    if (cleanLine.length > 0) {
      currentParagraph.push(cleanLine);
      inParagraph = true;
    }
  }

  // Handle any remaining paragraph
  if (currentParagraph.length > 0) {
    result.push(`<p class="article-paragraph">${currentParagraph.join(' ')}</p>`);
  }

  html = result.join('\n');

  // Clean up multiple blank lines
  html = html.replace(/\n{3,}/g, '\n\n');

  // Add references styling if references exist
  if (html.toLowerCase().includes('references')) {
    html = html.replace(
      /<h[^>]*>references?<\/h[^>]*>/gi,
      '<h2 class="references-title">References</h2>'
    );

    // Find and wrap references section
    const refIndex = html.toLowerCase().indexOf('references');
    if (refIndex !== -1) {
      const beforeRefs = html.substring(0, refIndex);
      const refsSection = html.substring(refIndex);

      // Find the end of references (next heading or end)
      const nextH2 = refsSection.search(/<h[12][^>]*>/i);
      const refsContent = nextH2 !== -1
        ? refsSection.substring(0, nextH2)
        : refsSection;

      const restContent = nextH2 !== -1
        ? refsSection.substring(nextH2)
        : '';

      // Wrap references in a styled div
      const styledRefs = `
        <div class="references-section">
          ${refsContent.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="reference-link">$1</a>')}
        </div>
      `;

      html = beforeRefs + styledRefs + restContent;
    }
  }

  return html;
}