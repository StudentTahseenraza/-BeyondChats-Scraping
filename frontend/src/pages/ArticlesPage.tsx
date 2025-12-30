import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { FaNewspaper, FaRobot, FaFileAlt } from 'react-icons/fa';
import ArticleList from '../components/ArticleList';

interface ArticlesPageProps {
  source?: string;
}

const ArticlesPage: React.FC<ArticlesPageProps> = ({ source }) => {
  const { source: urlSource } = useParams<{ source?: string }>();
  const actualSource = source || urlSource;

  const getTitle = () => {
    switch (actualSource) {
      case 'original':
        return 'Original Articles';
      case 'ai-updated':
        return 'AI-Enhanced Articles';
      default:
        return 'All Articles';
    }
  };

  const getDescription = () => {
    switch (actualSource) {
      case 'original':
        return 'Articles scraped directly from BeyondChats blog';
      case 'ai-updated':
        return 'Articles enhanced with AI for better readability and SEO';
      default:
        return 'Browse all articles from BeyondChats blog';
    }
  };

  const getIcon = () => {
    switch (actualSource) {
      case 'original':
        return <FaFileAlt className="me-2" />;
      case 'ai-updated':
        return <FaRobot className="me-2" />;
      default:
        return <FaNewspaper className="me-2" />;
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-5">
        <Col>
          <Card className="border-0 bg-light shadow-sm">
            <Card.Body className="text-center py-5">
              <div className="display-1 text-muted mb-3">
                {getIcon()}
              </div>
              <h1 className="display-5 fw-bold mb-3">{getTitle()}</h1>
              <p className="lead text-muted mb-0">{getDescription()}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <ArticleList 
            source={actualSource}
            title={getTitle()}
            limit={12}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ArticlesPage;