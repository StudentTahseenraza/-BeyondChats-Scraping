import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  ProgressBar,
  Modal,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaRobot,
  FaNewspaper,
  FaMagic,
  FaSync,
  FaArrowRight,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import ArticleList from '../components/ArticleList';
import { articleService } from '../services/api';
import { ScrapingStatus } from '../types';
import { Article } from '../types';
import { Form } from 'react-bootstrap';

const HomePage: React.FC = () => {
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  
  // Refresh trigger for ArticleList
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [enhancingSingle, setEnhancingSingle] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [showManualEnhance, setShowManualEnhance] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [aiMessage, setAiMessage] = useState<{ text: string, type: 'success' | 'warning' } | null>(null);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

  const fetchStatus = async () => {
    try {
      const response = await articleService.getScrapingStatus();
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Function to trigger refresh
  const triggerArticleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await articleService.getAIStatus();
      if (response.success) {
        setAiStatus(response.data);
        // Fetch pending articles
        const pendingResp = await articleService.getAllArticles(1, 10, 'original', false);
        if (pendingResp.success) {
          setPendingArticles(pendingResp.data);
        }
      }
    } catch (error) {
      console.error('Error fetching AI status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAIStatus();
  }, []);

  const handleScrapeArticles = async () => {
    try {
      setScraping(true);
      setScrapeMessage(null);

      const response = await articleService.scrapeArticles();

      if (response.success) {
        setScrapeMessage(`Successfully scraped ${response.data.length} articles`);
        fetchStatus(); // Refresh status
        
        // Trigger article list refresh after 1 second
        setTimeout(() => {
          triggerArticleRefresh();
        }, 1000);
      } else {
        setScrapeMessage(response.message || 'Failed to scrape articles');
      }
    } catch (error: any) {
      setScrapeMessage(error.message || 'An error occurred during scraping');
    } finally {
      setScraping(false);
    }
  };

  const handleEnhanceAll = async () => {
    try {
      setEnhancingAll(true);
      setAiMessage(null);

      const response = await articleService.enhanceAllArticles(selectedModel, 5);

      if (response.success) {
        setAiMessage({
          text: `Enhanced ${response.statistics.success} articles successfully!`,
          type: 'success'
        });
        fetchStatus();
        fetchAIStatus();
        // Trigger refresh after enhancement
        setTimeout(() => {
          triggerArticleRefresh();
        }, 1500);
      } else {
        setAiMessage({
          text: response.message || 'Failed to enhance articles',
          type: 'warning'
        });
      }
    } catch (error: any) {
      setAiMessage({
        text: error.message || 'An error occurred during enhancement',
        type: 'warning'
      });
    } finally {
      setEnhancingAll(false);
    }
  };

  const handleManualEnhance = async () => {
    if (!selectedArticleId) return;

    try {
      setEnhancingSingle(true);
      setAiMessage(null);

      const response = await articleService.enhanceArticle(selectedArticleId, selectedModel);

      if (response.success) {
        setAiMessage({
          text: `Article enhanced successfully with ${selectedModel}!`,
          type: 'success'
        });
        setSelectedArticleId('');
        fetchStatus();
        fetchAIStatus();
        // Trigger refresh after enhancement
        setTimeout(() => {
          triggerArticleRefresh();
        }, 1000);
      } else {
        setAiMessage({
          text: response.message || 'Failed to enhance article',
          type: 'warning'
        });
      }
    } catch (error: any) {
      setAiMessage({
        text: error.message || 'An error occurred',
        type: 'warning'
      });
    } finally {
      setEnhancingSingle(false);
    }
  };

  const handleTestAIConnection = async () => {
    try {
      setTestingAI(true);
      setAiMessage(null);

      const response = await articleService.testAIConnection(selectedModel);

      if (response.success) {
        setAiMessage({
          text: `${selectedModel.toUpperCase()} AI connection successful!`,
          type: 'success'
        });
      } else {
        setAiMessage({
          text: `${selectedModel.toUpperCase()} AI connection failed. Please check API key.`,
          type: 'warning'
        });
      }
    } catch (error: any) {
      setAiMessage({
        text: error.message || 'Error testing AI connection',
        type: 'warning'
      });
    } finally {
      setTestingAI(false);
    }
  };

  const handleDeleteAllArticles = async () => {
    try {
      setDeleting(true);
      setDeleteMessage(null);
      
      const response = await articleService.deleteAllArticles();
      
      if (response.success) {
        const deletedCount = response.data?.deletedCount || 
                            (response as any).deletedCount || 
                            0;
        
        setDeleteMessage(`✅ Successfully deleted ${deletedCount} articles`);
        fetchStatus(); // Refresh status
        setShowDeleteModal(false);
        
        // Trigger article list refresh immediately
        triggerArticleRefresh();
      } else {
        setDeleteMessage(`❌ Failed to delete articles: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      setDeleteMessage(`❌ Error: ${error.message || 'Failed to delete articles'}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Hero Section */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-5 fw-bold mb-3">
            <FaRobot className="me-2 text-primary" />
            BeyondChats Articles
          </h1>
          <p className="lead text-muted mb-4">
            View original articles scraped from BeyondChats blog and their AI-enhanced versions
            with improved formatting, structure, and SEO optimization.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <Button
              as={Link}
              to="/articles"
              variant="primary"
              size="lg"
              className="px-4"
            >
              <FaNewspaper className="me-2" /> Browse Articles
            </Button>
            <Button
              as={Link}
              to="/articles/ai-updated"
              variant="outline-primary"
              size="lg"
              className="px-4"
            >
              <FaMagic className="me-2" /> AI-Enhanced
            </Button>
          </div>
        </Col>
      </Row>

      {/* Stats Section */}
      {status && (
        <Row className="mb-5">
          <Col md={4} className="mb-4 mb-md-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-6 fw-bold text-primary mb-2">
                  {status.totalArticles}
                </div>
                <Card.Title>Total Articles</Card.Title>
                <Card.Text className="text-muted">
                  Combined original and AI-enhanced articles
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} className="mb-4 mb-md-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-6 fw-bold text-success mb-2">
                  {status.originalArticles}
                </div>
                <Card.Title>Original Articles</Card.Title>
                <Card.Text className="text-muted">
                  Scraped from BeyondChats blog
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-6 fw-bold text-warning mb-2">
                  {status.updatedArticles}
                </div>
                <Card.Title>AI-Enhanced</Card.Title>
                <Card.Text className="text-muted">
                  Articles enhanced with Gemini AI
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Scraping Section */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaSync className="me-2 text-primary" />
                Article Scraping Status
              </Card.Title>

              {scrapeMessage && (
                <Alert
                  variant={scrapeMessage.includes('Successfully') ? 'success' : 'warning'}
                  className="mt-3"
                >
                  {scrapeMessage}
                </Alert>
              )}

              {status && (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Original Articles: {status.originalArticles}/5</span>
                      <span>{Math.round((status.originalArticles / 5) * 100)}%</span>
                    </div>
                    <ProgressBar
                      now={(status.originalArticles / 5) * 100}
                      variant={status.needsScraping ? 'warning' : 'success'}
                      className="mb-3"
                    />
                  </div>

                  <Button
                    onClick={handleScrapeArticles}
                    disabled={scraping || !status.needsScraping}
                    variant={status.needsScraping ? 'primary' : 'secondary'}
                  >
                    {scraping ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Scraping...
                      </>
                    ) : status.needsScraping ? (
                      <>
                        <FaSync className="me-2" /> Scrape New Articles
                      </>
                    ) : (
                      'All Articles Scraped'
                    )}
                  </Button>

                  {!status.needsScraping && (
                    <p className="text-success mt-2 mb-0">
                      ✓ All 5 articles have been scraped
                    </p>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* AI Enhancement Section
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaRobot className="me-2 text-warning" />
                AI Enhancement Status
              </Card.Title>

              {aiStatus && (
                <div className="mb-4">
                  <Row>
                    <Col md={3} className="mb-3 mb-md-0">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="h4 mb-1 text-primary">{aiStatus.enhancedArticles}</div>
                        <div className="text-muted">Enhanced</div>
                      </div>
                    </Col>
                    <Col md={3} className="mb-3 mb-md-0">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="h4 mb-1 text-warning">{aiStatus.pendingArticles}</div>
                        <div className="text-muted">Pending</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center h-100">
                        <div>
                          <ProgressBar
                            now={(aiStatus.enhancedArticles / aiStatus.totalArticles) * 100}
                            variant="warning"
                            className="mb-2"
                          />
                          <small className="text-muted">
                            {Math.round((aiStatus.enhancedArticles / aiStatus.totalArticles) * 100)}% enhanced
                          </small>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              <div className="d-grid gap-3">
                <Button
                  onClick={handleEnhanceAll}
                  disabled={enhancingAll || !aiStatus?.needsEnhancement}
                  variant={aiStatus?.needsEnhancement ? 'warning' : 'secondary'}
                  size="lg"
                >
                  {enhancingAll ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Enhancing All Articles...
                    </>
                  ) : aiStatus?.needsEnhancement ? (
                    <>
                      <FaRobot className="me-2" />
                      Enhance All with AI
                    </>
                  ) : (
                    'All Articles Enhanced'
                  )}
                </Button>

                {/* <div className="d-flex gap-2">
                  <Button
                    variant="outline-warning"
                    onClick={() => setShowManualEnhance(!showManualEnhance)}
                  >
                    <FaMagic className="me-2" />
                    {showManualEnhance ? 'Hide Manual Options' : 'Manual Enhancement'}
                  </Button>

                  <Button
                    variant="outline-info"
                    onClick={handleTestAIConnection}
                    disabled={testingAI}
                  >
                    {testingAI ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                    ) : (
                      <FaSync className="me-2" />
                    )}
                    Test AI Connection
                  </Button>
                </div> */}
{/* 
                {showManualEnhance && (
                  <Card className="border-warning">
                    <Card.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Select Article to Enhance</Form.Label>
                          <Form.Select
                            value={selectedArticleId}
                            onChange={(e) => setSelectedArticleId(e.target.value)}
                          >
                            <option value="">Choose an article...</option>
                            {pendingArticles.map(article => (
                              <option key={article._id} value={article._id}>
                                {article.title.substring(0, 50)}...
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>AI Model</Form.Label>
                          <Form.Select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                          >
                            <option value="gemini">Gemini AI</option>
                            <option value="openrouter">OpenRouter (Mistral)</option>
                          </Form.Select>
                        </Form.Group>

                        <Button
                          onClick={handleManualEnhance}
                          disabled={!selectedArticleId || enhancingSingle}
                          variant="warning"
                        >
                          {enhancingSingle ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <FaMagic className="me-2" />
                              Enhance Selected Article
                            </>
                          )}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                )}

                {aiMessage && (
                  <Alert
                    variant={aiMessage.type === 'success' ? 'success' : 'warning'}
                    className="mt-3"
                    dismissible
                    onClose={() => setAiMessage(null)}
                  >
                    {aiMessage.text}
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row> */} 

      {/* Delete Articles Section */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm border-danger">
            <Card.Body>
              <Card.Title className="d-flex align-items-center text-danger">
                <FaExclamationTriangle className="me-2" />
                Danger Zone
              </Card.Title>
              
              <Card.Text className="text-muted mb-4">
                Warning: This action will permanently delete all articles from the database. 
                This cannot be undone.
              </Card.Text>
              
              <Button
                variant="outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <FaTrash className="me-2" />
                Delete All Articles
              </Button>
              
              {deleteMessage && (
                <Alert
                  variant={deleteMessage.includes('Successfully') ? 'success' : 'danger'}
                  className="mt-3"
                  dismissible
                  onClose={() => setDeleteMessage(null)}
                >
                  {deleteMessage}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Articles */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h4 mb-0">
              <FaNewspaper className="me-2" />
              Recent Articles
            </h2>
            <Button as={Link} to="/articles" variant="outline-primary" size="sm">
              View All <FaArrowRight className="ms-1" />
            </Button>
          </div>
          {/* Pass refreshTrigger as key to force re-render */}
          <ArticleList key={`recent-${refreshTrigger}`} limit={6} />
        </Col>
      </Row>

      {/* AI-Enhanced Articles */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h4 mb-0">
              <FaMagic className="me-2 text-warning" />
              AI-Enhanced Articles
            </h2>
            <Button as={Link} to="/articles/ai-updated" variant="outline-warning" size="sm">
              View All <FaArrowRight className="ms-1" />
            </Button>
          </div>
          {/* Pass refreshTrigger as key to force re-render */}
          <ArticleList key={`ai-${refreshTrigger}`} source="ai-updated" limit={3} />
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton className="border-danger">
          <Modal.Title className="text-danger">
            <FaExclamationTriangle className="me-2" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FaExclamationTriangle size={48} className="text-danger mb-3" />
            <h5>Are you sure you want to delete ALL articles?</h5>
            <p className="text-muted">
              This action will delete:
            </p>
            <ul className="text-start">
              <li>All original articles</li>
              <li>All AI-enhanced articles</li>
              <li>All article data and content</li>
            </ul>
            <p className="text-danger fw-bold">
              This action cannot be undone!
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAllArticles}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Yes, Delete All Articles
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HomePage;