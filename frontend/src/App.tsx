import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import AboutPage from './pages/AboutPage';
// import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/original" element={<ArticlesPage source="original" />} />
            <Route path="/articles/ai-updated" element={<ArticlesPage source="ai-updated" />} />
            <Route path="/articles/:id" element={<ArticleDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;