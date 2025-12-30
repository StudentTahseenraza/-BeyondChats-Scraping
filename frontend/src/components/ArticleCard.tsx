import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaExternalLinkAlt, 
  FaRobot, 
  FaFileAlt,
  FaEye,
  FaImage
} from 'react-icons/fa';
import { Article } from '../types';
import { formatDate, truncateText, isAIUpdated, getPlainTextExcerpt } from '../utils/helpers';

interface ArticleCardProps {
  article: Article;
  showActions?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, showActions = true }) => {
  const isEnhanced = isAIUpdated(article);
  const hasUpdatedContent = article.updatedContent && article.updatedContent.length > 0;
  
  // Get clean excerpt without HTML
  const cleanExcerpt = getPlainTextExcerpt(
    article.originalContent || article.originalText || '', 
    150
  );
  
  // Get first image if available
  const firstImage = article.images && article.images.length > 0 
    ? article.images[0].url 
    : null;

  return (
    <Card className="h-100 shadow-sm border-0 article-card">
      {/* Show article image if available */}
      {firstImage && (
        <div className="card-image-container" style={{ 
          height: '180px', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Card.Img 
            variant="top" 
            src={firstImage} 
            alt={article.images[0].alt || article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <div className="image-overlay" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <FaImage size={10} /> Image
          </div>
        </div>
      )}
      
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            {isEnhanced ? (
              <Badge bg="success" className="mb-2">
                <FaRobot className="me-1" /> AI-Enhanced
              </Badge>
            ) : (
              <Badge bg="secondary" className="mb-2">
                <FaFileAlt className="me-1" /> Original
              </Badge>
            )}
            
            {hasUpdatedContent && !isEnhanced && (
              <Badge bg="warning" text="dark" className="ms-1">
                Updated Available
              </Badge>
            )}
          </div>
          
          <small className="text-muted">
            <FaCalendarAlt className="me-1" />
            {formatDate(article.publishedDate || article.createdAt)}
          </small>
        </div>
        
        <Card.Title className="h5 mb-3">
          <Link to={`/articles/${article._id}`} className="text-decoration-none text-dark">
            {truncateText(article.title, 80)}
          </Link>
        </Card.Title>
        
        {/* Show clean excerpt without HTML tags */}
        <Card.Text className="flex-grow-1 text-muted" style={{ 
          lineHeight: '1.5',
          fontSize: '0.9rem'
        }}>
          {cleanExcerpt || 'No content available'}
        </Card.Text>
        
        {/* Show image count if there are images */}
        {article.images && article.images.length > 0 && (
          <div className="mb-2">
            <small className="text-muted">
              <FaImage className="me-1" />
              {article.images.length} image{article.images.length !== 1 ? 's' : ''}
            </small>
          </div>
        )}
        
        {article.references && article.references.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">
              References: {article.references.length}
            </small>
          </div>
        )}
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {showActions && (
                <>
                  <Button 
                    as={Link}
                    to={`/articles/${article._id}`}
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                  >
                    <FaEye className="me-1" /> View
                  </Button>
                  
                  <Button
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline-secondary"
                    size="sm"
                  >
                    <FaExternalLinkAlt className="me-1" /> Source
                  </Button>
                </>
              )}
            </div>
            
            <small className="text-muted">
              {article.source === 'ai-updated' ? 'Enhanced' : 'Original'}
            </small>
          </div>
        </div>
      </Card.Body>
      
      <Card.Footer className="bg-transparent border-top-0 pt-0">
        <div className="d-flex justify-content-between">
          <small className="text-muted">
            ID: {article._id?.substring(0, 8) || 'N/A'}...
          </small>
          <small className="text-muted">
            Scraped: {formatDate(article.scrapedAt)}
          </small>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default ArticleCard;