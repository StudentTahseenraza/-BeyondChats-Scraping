import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Pagination, Form, Button } from 'react-bootstrap';
import ArticleCard from './ArticleCard';
import { Article } from '../types';
import { articleService } from '../services/api';

interface ArticleListProps {
  source?: string;
  title?: string;
  limit?: number;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  source, 
  title = 'Articles',
  limit = 9 
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchArticles = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await articleService.getAllArticles(
        page, 
        limit, 
        source,
        undefined,
        searchQuery || undefined
      );
      
      if (response.success) {
        setArticles(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalArticles(response.total || 0);
      } else {
        setError(response.message || 'Failed to fetch articles');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage, source, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles(1);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Articles</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => fetchArticles(currentPage)}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="article-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">{title}</h2>
          <p className="text-muted mb-0">
            Showing {articles.length} of {totalArticles} articles
            {source && ` • Source: ${source}`}
          </p>
        </div>
        
        <Form onSubmit={handleSearch} className="d-flex">
          <Form.Control
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="me-2"
            style={{ width: '250px' }}
          />
          <Button variant="outline-secondary" type="submit">
            Search
          </Button>
        </Form>
      </div>
      
      {articles.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No Articles Found</Alert.Heading>
          <p>
            {searchQuery 
              ? `No articles found for "${searchQuery}"`
              : source
                ? `No ${source} articles available`
                : 'No articles available'
            }
          </p>
        </Alert>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {articles.map((article) => (
              <Col key={article._id}>
                <ArticleCard article={article} />
              </Col>
            ))}
          </Row>
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArticleList;