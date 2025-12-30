import axios from 'axios';
import { Article, ApiResponse, ScrapingStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const articleService = {
  // Get all articles with pagination
  async getAllArticles(
    page: number = 1,
    limit: number = 10,
    source?: string,
    isUpdated?: boolean,
    search?: string
  ): Promise<ApiResponse<Article[]>> {
    const params: any = { page, limit };
    if (source) params.source = source;
    if (isUpdated !== undefined) params.isUpdated = isUpdated;
    if (search) params.search = search;

    const response = await api.get('/articles', { params });
    return response.data;
  },

  // Get single article by ID
  async getArticleById(id: string): Promise<ApiResponse<Article>> {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },

  // Get article by slug
  async getArticleBySlug(slug: string): Promise<ApiResponse<Article>> {
    const response = await api.get(`/articles/slug/${slug}`);
    return response.data;
  },

  // Get scraping status
  async getScrapingStatus(): Promise<ApiResponse<ScrapingStatus>> {
    const response = await api.get('/articles/status');
    return response.data;
  },

  // Scrape new articles
  async scrapeArticles(): Promise<ApiResponse<Article[]>> {
    const response = await api.get('/articles/scrape');
    return response.data;
  },

  // Search articles
  async searchArticles(query: string, limit: number = 10): Promise<ApiResponse<Article[]>> {
    const response = await api.get('/articles/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Create article
  async createArticle(articleData: Partial<Article>): Promise<ApiResponse<Article>> {
    const response = await api.post('/articles', articleData);
    return response.data;
  },

  // Update article
  async updateArticle(id: string, updateData: Partial<Article>): Promise<ApiResponse<Article>> {
    const response = await api.put(`/articles/${id}`, updateData);
    return response.data;
  },

  // // Delete article
  // async deleteArticle(id: string): Promise<ApiResponse<Article>> {
  //   const response = await api.delete(`/articles/${id}`);
  //   return response.data;
  // },

  async enhanceArticle(id: string, model?: string): Promise<ApiResponse<Article>> {
    const response = await api.post(`/ai/enhance/${id}`, { model });
    return response.data;
  },

  async enhanceAllArticles(model?: string, limit?: number): Promise<ApiResponse<any>> {
    const response = await api.post('/ai/enhance-all', { model, limit });
    return response.data;
  },

  async getAIStatus(): Promise<ApiResponse<any>> {
    const response = await api.get('/ai/status');
    return response.data;
  },

  async testAIConnection(model: string): Promise<ApiResponse<any>> {
    const response = await api.post('/ai/test-connection', { model });
    return response.data;
  },

   // Delete all articles
  async deleteAllArticles(): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const response = await api.delete('/articles');
      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Delete single article
  async deleteArticle(id: string): Promise<ApiResponse<Article>> {
    try {
      const response = await api.delete(`/articles/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

};

export default api;