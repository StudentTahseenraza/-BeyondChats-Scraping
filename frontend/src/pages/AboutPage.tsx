import React from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { 
  FaGithub, 
  FaCode, 
  FaDatabase, 
  FaRobot, 
  FaReact,
  FaNodeJs,
  FaPython,
  FaCheckCircle
} from 'react-icons/fa';

const AboutPage: React.FC = () => {
  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-5 fw-bold mb-3">About This Project</h1>
          <p className="lead text-muted">
            A Full Stack Web Development internship assignment for BeyondChats showcasing 
            web scraping, AI content enhancement, and modern web development.
          </p>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="h4 mb-3">
                <FaCode className="me-2 text-primary" />
                Project Overview
              </Card.Title>
              <Card.Text>
                This project demonstrates a complete full-stack solution with three phases:
              </Card.Text>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 px-0 py-2">
                  <FaCheckCircle className="me-2 text-success" />
                  <strong>Phase 1:</strong> Scrapes 5 oldest articles from BeyondChats blog
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0 py-2">
                  <FaCheckCircle className="me-2 text-success" />
                  <strong>Phase 2:</strong> Uses AI to enhance articles with competitor references
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0 py-2">
                  <FaCheckCircle className="me-2 text-success" />
                  <strong>Phase 3:</strong> React frontend to display original and AI-enhanced versions
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="h4 mb-3">
                <FaRobot className="me-2 text-warning" />
                AI Enhancement Features
              </Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 px-0 py-2">
                  <strong>Content Improvement:</strong> Better structure, formatting, and readability
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0 py-2">
                  <strong>SEO Optimization:</strong> Natural keyword inclusion and meta improvements
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0 py-2">
                  <strong>Reference Integration:</strong> Cites competitor articles used for enhancement
                </ListGroup.Item>
                <ListGroup.Item className="border-0 px-0 py-2">
                  <strong>Quality Preservation:</strong> Maintains original message while enhancing delivery
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="h4 mb-4">
                <FaGithub className="me-2" />
                Technology Stack
              </Card.Title>
              
              <Row>
                <Col md={4} className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaNodeJs className="me-2 text-success fs-4" />
                    <h5 className="mb-0">Backend</h5>
                  </div>
                  <ul className="list-unstyled">
                    <li>Node.js + Express</li>
                    <li>MongoDB + Mongoose</li>
                    <li>Cheerio for web scraping</li>
                    <li>Axios for HTTP requests</li>
                  </ul>
                </Col>
                
                <Col md={4} className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaRobot className="me-2 text-warning fs-4" />
                    <h5 className="mb-0">AI Processing</h5>
                  </div>
                  <ul className="list-unstyled">
                    <li>Google Gemini AI</li>
                    <li>Free tier (60 requests/min)</li>
                    <li>Content enhancement</li>
                    <li>Reference management</li>
                  </ul>
                </Col>
                
                <Col md={4} className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaReact className="me-2 text-info fs-4" />
                    <h5 className="mb-0">Frontend</h5>
                  </div>
                  <ul className="list-unstyled">
                    <li>React + TypeScript</li>
                    <li>Vite for fast builds</li>
                    <li>React Bootstrap</li>
                    <li>React Router</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutPage;