import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  ProgressBar,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaRobot,
  FaNewspaper,
  FaMagic,
  FaSync,
  FaArrowRight
} from 'react-icons/fa';
import ArticleList from '../components/ArticleList';
import { articleService } from '../services/api';
import { ScrapingStatus } from '../types';
import { Article } from '../types';

const HomePage: React.FC = () => {
  const [status, setStatus] = useState<ScrapingStatus | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStatus();
  }, []);


  const handleScrapeArticles = async () => {
    try {
      setScraping(true);
      setScrapeMessage(null);

      const response = await articleService.scrapeArticles();

      if (response.success) {
        setScrapeMessage(`Successfully scraped ${response.data.length} articles`);
        fetchStatus(); // Refresh status
      } else {
        setScrapeMessage(response.message || 'Failed to scrape articles');
      }
    } catch (error: any) {
      setScrapeMessage(error.message || 'An error occurred during scraping');
    } finally {
      setScraping(false);
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
          <ArticleList limit={6} />
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
          <ArticleList source="ai-updated" limit={3} />
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;