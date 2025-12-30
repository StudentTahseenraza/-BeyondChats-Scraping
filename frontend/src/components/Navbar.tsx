import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaHome, FaNewspaper, FaRobot, FaGithub, FaBars } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaRobot className="me-2" />
          <span className="fw-bold">BeyondChats</span>
          <span className="text-muted ms-1">Articles</span>
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav">
          <FaBars />
        </BootstrapNavbar.Toggle>
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
              <FaHome className="me-1" /> Home
            </Nav.Link>
            
            <NavDropdown 
              title={<><FaNewspaper className="me-1" /> Articles</>} 
              id="articles-dropdown"
            >
              <NavDropdown.Item as={Link} to="/articles">
                All Articles
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/articles/original">
                Original Articles
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/articles/ai-updated">
                AI-Enhanced Articles
              </NavDropdown.Item>
            </NavDropdown>
            
            {/* <Nav.Link as={Link} to="/scrape">
              Scrape Articles
            </Nav.Link> */}
            
            <Nav.Link as={Link} to="/about">
              About
            </Nav.Link>
          </Nav>
          
          <Nav>
            <Nav.Link 
              href="https://github.com/yourusername/beyondchats-intern-assignment" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="me-1" /> GitHub
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;