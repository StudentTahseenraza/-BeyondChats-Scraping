import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Tabs,
  Tab,
  ListGroup
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaRobot,
  FaFileAlt,
  FaLink,
  FaCopy,
  FaCheck
} from 'react-icons/fa';
import { articleService } from '../services/api';
import { Article } from '../types';
import { formatDate, getDomainFromUrl, safeHtml, formatArticleContentForDisplay, formatContentAsHtml } from '../utils/helpers';


const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'updated'>('updated');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await articleService.getArticleById(id);

      if (response.success) {
        setArticle(response.data);
        // Set default tab based on available content
        if (response.data.updatedContent) {
          setActiveTab('updated');
        } else {
          setActiveTab('original');
        }
      } else {
        setError(response.message || 'Article not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const getFormattedContent = () => {
  if (!article) return { __html: '' };
  
  let content = '';
  if (activeTab === 'updated' && article.updatedContent) {
    // Use the formatter to convert to HTML
    content = formatContentAsHtml(article.updatedContent);
  } else {
    content = article.originalContent || article.originalText || '';
  }
  
  return { __html: content };
};

// Add a class for references
const formatReferences = (references: string[]) => {
  if (!references || references.length === 0) return '';
  
  return `
    <h2>References</h2>
    <div class="references-list">
      <ul>
        ${references.map(ref => `<li><a href="${ref}" target="_blank">${ref}</a></li>`).join('')}
      </ul>
    </div>
  `;
};


  const handleCopyLink = () => {
    if (article) {
      const url = `${window.location.origin}/articles/${article._id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getContent = () => {
    if (!article) return '';

    if (activeTab === 'updated' && article.updatedContent) {
      return article.updatedContent;
    }
    return article.originalContent || article.originalText || '';
  };

  const getContentForDisplay = () => {
    const content = getContent();
    return formatArticleContentForDisplay(content);
  };

  const isAIUpdated = article?.source === 'ai-updated' && article?.isUpdated === true;
  const hasUpdatedContent = article?.updatedContent && article.updatedContent.length > 0;

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading article...</p>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Article</Alert.Heading>
          <p>{error || 'Article not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Navigation */}
      <div className="mb-4">
        <Button
          variant="outline-secondary"
          onClick={() => navigate(-1)}
          className="mb-3"
        >
          <FaArrowLeft className="me-2" /> Back to Articles
        </Button>
      </div>

      {/* Article Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="d-flex align-items-center mb-2">
                {isAIUpdated ? (
                  <Badge bg="success" className="me-2">
                    <FaRobot className="me-1" /> AI-Enhanced
                  </Badge>
                ) : (
                  <Badge bg="secondary" className="me-2">
                    <FaFileAlt className="me-1" /> Original
                  </Badge>
                )}

                <Badge bg="light" text="dark" className="me-2">
                  {article.source}
                </Badge>

                <small className="text-muted">
                  <FaCalendarAlt className="me-1" />
                  {formatDate(article.createdAt)}
                </small>
              </div>

              <h1 className="h2 mb-3">{article.title}</h1>

              <div className="d-flex align-items-center gap-3">
                <Button
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-primary"
                  size="sm"
                >
                  <FaExternalLinkAlt className="me-1" /> View Original
                </Button>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <FaCheck className="me-1" /> Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy className="me-1" /> Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Content Tabs */}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k as any)}
                className="mb-4"
              >
                <Tab
                  eventKey="original"
                  title={
                    <>
                      <FaFileAlt className="me-1" />
                      Original Content
                    </>
                  }
                >
                  {activeTab === 'original' && (
                    <div className="mt-4">
                      <div
                        className="article-content"
                        dangerouslySetInnerHTML={getFormattedContent()}
                      />
                    </div>
                  )}
                </Tab>

                {hasUpdatedContent && (
                  <Tab
                    eventKey="updated"
                    title={
                      <>
                        <FaRobot className="me-1" />
                        AI-Enhanced Content
                      </>
                    }
                  >
                    {activeTab === 'updated' && article.updatedContent && (
                      <div className="mt-4">
                        <Alert variant="info" className="mb-4">
                          <Alert.Heading>AI Enhancement</Alert.Heading>
                          <p className="mb-0">
                            This content has been enhanced using Gemini AI to improve
                            readability, structure, and SEO optimization while maintaining
                            the original message.
                          </p>
                        </Alert>

                        <div
                          className="article-content"
                          dangerouslySetInnerHTML={safeHtml(article.updatedContent)}
                        />
                      </div>
                    )}
                  </Tab>
                )}
              </Tabs>
            </Card.Body>
          </Card>

          {/* References */}
          {article.references && article.references.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Card.Title className="h5 mb-3">
                  <FaLink className="me-2" />
                  References
                </Card.Title>
                <Card.Text className="text-muted mb-3">
                  These are the articles that were used as references for the AI enhancement:
                </Card.Text>

                <ListGroup variant="flush">
                  {article.references.map((ref, index) => (
                    <ListGroup.Item key={index} className="border-0 px-0">
                      <div className="d-flex align-items-start">
                        <Badge bg="light" text="dark" className="me-3 mt-1">
                          {index + 1}
                        </Badge>
                        <div>
                          <a
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            {getDomainFromUrl(ref)}
                          </a>
                          <div className="text-muted small">
                            {ref}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="h6 mb-3">Article Details</Card.Title>

              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">ID:</span>
                  <span className="font-monospace small">{article._id}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">Source:</span>
                  <Badge bg={article.source === 'ai-updated' ? 'success' : 'secondary'}>
                    {article.source}
                  </Badge>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">Published:</span>
                  <span>{formatDate(article.publishedDate)}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">Scraped:</span>
                  <span>{formatDate(article.scrapedAt)}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">Updated:</span>
                  <span>{article.updatedAt ? formatDate(article.updatedAt) : 'Never'}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">Content Length:</span>
                  <span>
                    {(article.originalContent || article.originalText || '').length} chars
                    {article.updatedContent && (
                      <> → {article.updatedContent.length} chars</>
                    )}
                  </span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between border-0 px-0 py-2">
                  <span className="text-muted">References:</span>
                  <span>{article.references?.length || 0}</span>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="h6 mb-3">Article Actions</Card.Title>

              <div className="d-grid gap-2">
                <Button
                  variant="outline-primary"
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaExternalLinkAlt className="me-2" />
                  Visit Original Article
                </Button>

                {hasUpdatedContent && (
                  <Button
                    variant={activeTab === 'updated' ? 'warning' : 'outline-warning'}
                    onClick={() => setActiveTab('updated')}
                  >
                    <FaRobot className="me-2" />
                    View AI-Enhanced Version
                  </Button>
                )}

                <Button
                  variant="outline-secondary"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <FaCheck className="me-2" /> Link Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy className="me-2" /> Copy Article Link
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleDetailPage;