export interface Article {
  _id: string;
  title: string;
  slug: string;
  originalContent: string;
  updatedContent: string | null;
  originalUrl: string;
  publishedDate: string;
  source: 'original' | 'ai-updated';
  references: string[];
  isUpdated: boolean;
  scrapedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

export interface ScrapingStatus {
  totalArticles: number;
  originalArticles: number;
  updatedArticles: number;
  needsScraping: boolean;
  status: string;
}

export interface DeleteResponse {
  deletedCount: number;
  success: boolean;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}