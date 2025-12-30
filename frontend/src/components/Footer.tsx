import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaGithub, FaHeart, FaCode } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light mt-auto py-4">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              <FaCode className="me-2 text-primary" />
              <h5 className="mb-0">BeyondChats Intern Assignment</h5>
            </div>
            <p className="text-muted mb-0 mt-2 small">
              A full-stack web development project showcasing web scraping, 
              AI content enhancement, and modern React development.
            </p>
          </Col>
          
          <Col md={6} className="text-md-end">
            <div className="d-flex justify-content-md-end gap-3">
              <a 
                href="https://github.com/yourusername/beyondchats-intern-assignment" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-light text-decoration-none"
              >
                <FaGithub className="me-1" /> GitHub
              </a>
              
              <span className="text-muted">|</span>
              
              <span className="text-muted small">
                Made with <FaHeart className="text-danger mx-1" /> for BeyondChats
              </span>
            </div>
            
            <div className="mt-2">
              <span className="text-muted small">
                © {currentYear} Full Stack Web Developer Intern Assignment
              </span>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;