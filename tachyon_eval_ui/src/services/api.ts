import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Types
export interface Golden {
  id: string;
  input: string;
  actualOutput?: string;
  expectedOutput: string;
  context: string;
  retrievalContext: string;
  count: number;
  tags: string[];
}

export interface Dataset {
  id: string;
  alias: string;
  numGoldens: number;
  updated_at: string;
  user: string;
  created_at: string;
}

export interface EvaluationHistory {
  id: string;
  evaluation_name: string,
  dataset_id: string,
  model_id: string,
  temperature: string,
  parameters: [
    {
      name: string,
      value: string
    }
  ],
  usecase_id: string,
  created_at: string,
  updated_at: string,
  completed_at: string,
  failed_at: string,
  status: string,
  result: {},
  error: string
}


interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface RetryConfig extends AxiosRequestConfig {
  _retryCount?: number;
}

interface CacheHitError extends Error {
  __CACHE_HIT__: true;
  data: any;
}

interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Service
class ApiService {
  private static instance: ApiService;
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  private cache: Map<string, CacheEntry<any>> = new Map();
  private usecase: string = 'usecase_001'; // Default usecase

  private constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Check cache for GET requests
        if (config.method === 'get') {
          const cacheKey = this.getCacheKey(config);
          const cachedData = this.getFromCache(cacheKey);
          if (cachedData) {
            const error = new Error('Cache hit') as CacheHitError;
            error.__CACHE_HIT__ = true;
            error.data = cachedData;
            return Promise.reject(error);
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Cache successful GET responses
        if (response.config.method === 'get') {
          const cacheKey = this.getCacheKey(response.config);
          this.setCache(cacheKey, response.data);
        }
        return response;
      },
      async (error: unknown) => {
        // Handle cache hits
        if (error instanceof Error && '__CACHE_HIT__' in error) {
          const cacheHitError = error as CacheHitError;
          return { data: cacheHitError.data };
        }

        const axiosError = error as AxiosError<ErrorResponse>;
        const config = axiosError.config as RetryConfig;
        
        // Initialize retry count
        config._retryCount = config._retryCount || 0;

        // Handle specific error cases
        if (axiosError.response) {
          switch (axiosError.response.status) {
            case 401:
              localStorage.removeItem('token');
              window.location.href = '/login';
              break;
            case 403:
              throw new ApiError(403, 'You do not have permission to perform this action');
            case 404:
              throw new ApiError(404, 'The requested resource was not found');
            case 429:
              throw new ApiError(429, 'Too many requests. Please try again later');
            case 500:
              throw new ApiError(500, 'Internal server error. Please try again later');
          }
        }

        // Retry logic for network errors or 5xx errors
        if (
          (axiosError.code === 'ECONNABORTED' || !axiosError.response || axiosError.response.status >= 500) &&
          config._retryCount < MAX_RETRIES
        ) {
          config._retryCount += 1;
          
          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.api(config);
        }

        // Handle network errors
        if (!axiosError.response) {
          throw new ApiError(0, 'Network error. Please check your connection');
        }

        // Handle other errors
        throw new ApiError(
          axiosError.response.status,
          axiosError.response.data?.message || 'An unexpected error occurred',
          axiosError.response.data
        );
      }
    );
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Set usecase
  setUsecase(usecase: string) {
    this.usecase = usecase;
    this.clearCache(); // Clear cache when usecase changes
  }

  // Get current usecase
  getUsecase(): string {
    return this.usecase;
  }

  // Dataset APIs
  async getDatasets(): Promise<Dataset[]> {
    try {
      const response = await this.api.get(`/api/v1/usecases/${this.usecase}/datasets`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch datasets');
    }
  }

  async createDataset(alias: string): Promise<Dataset> {
    try {
      const response = await this.api.post(`/api/v1/usecases/${this.usecase}/datasets`, { alias });
      this.clearCache(); // Clear cache after mutation
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create dataset');
    }
  }

  async deleteDataset(datasetId: string): Promise<void> {
    try {
      await this.api.delete(`/api/v1/usecases/${this.usecase}/datasets/${datasetId}`);
      this.clearCache(); // Clear cache after mutation
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete dataset');
    }
  }

  // Golden APIs
  async getGoldens(datasetId: string): Promise<Golden[]> {
    try {
      const response = await this.api.get(`/api/v1/usecases/${this.usecase}/datasets/${datasetId}/goldens`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch goldens');
    }
  }

  async createGolden(datasetName: string, golden: Omit<Golden, 'id'>): Promise<Golden> {
    try {
      const response = await this.api.post(`/api/v1/usecases/${this.usecase}/datasets/${datasetName}/goldens`, golden);
      this.clearCache(); // Clear cache after mutation
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create golden');
    }
  }

  async updateGolden(datasetId: string, goldenId: string, golden: Partial<Golden>): Promise<Golden> {
    try {
      const response = await this.api.put(`/api/v1/usecases/${this.usecase}/datasets/${datasetId}/goldens/${goldenId}`, golden);
      this.clearCache(); // Clear cache after mutation
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update golden');
    }
  }

  async deleteGolden(datasetName: string, goldenId: string): Promise<void> {
    try {
      await this.api.delete(`/api/v1/usecases/${this.usecase}/datasets/${datasetName}/goldens/${goldenId}`);
      this.clearCache(); // Clear cache after mutation
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete golden');
    }
  }

  async importGoldens(datasetId: string, goldens: Omit<Golden, 'id'>[]): Promise<Golden[]> {
    try {
      const response = await this.api.post(`/api/v1/usecases/${this.usecase}/datasets/${datasetId}/goldens/import`,  goldens );
      this.clearCache(); // Clear cache after mutation
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to import goldens');
    }
  }

  // Content Generation API
  async generateContent(datasetId: string, golden: Partial<Golden>): Promise<Golden[]> {
    try {
      const response = await this.api.post(`/api/v1/usecases/${this.usecase}/datasets/${datasetId}/goldens/generate`, golden);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to generate content');
    }
  }

  // Evaluation API
  async submitEvaluation(params: {
    evaluation_name: string,
    dataset_id: string,
    model_id: string,
    temperature: string,
    parameters: {
      name: string,
      value: string
    }[]
  }): Promise<EvaluationHistory> {

    try {
      
      const response = await this.api.post(`/api/v1/usecases/${this.usecase}/evaluations`, params);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to evaluate model');
    }
  }

  async getEvaluationStatus(evaluationId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    message: string;
    details: {
      totalGoldens: number;
      processedGoldens: number;
      startTime: string;
      estimatedTimeRemaining?: string;
      currentGolden?: {
        id: string;
        input: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
      };
    };
  }> {
    try {
      const response = await this.api.get(`/api/v1/usecases/${this.usecase}/evaluations/${evaluationId}/status`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get evaluation status');
    }
  }

  async getEvaluationHistory(): Promise<EvaluationHistory[]> {
    try {
      const response = await this.api.get(`/api/v1/usecases/${this.usecase}/evaluations`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch evaluation history');
    }
  }
}

export const apiService = ApiService.getInstance(); 