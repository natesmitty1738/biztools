export interface Item {
  id: string;
  title: string;
  description: string;
  categories: string[];
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInteraction {
  userId: string;
  itemId: string;
  interactionType: 'click' | 'view' | 'purchase' | 'favorite';
  timestamp: Date;
}

export interface RecommendationRequest {
  userId: string;
  context?: string;
  limit?: number;
  filters?: {
    categories?: string[];
    features?: string[];
  };
}

export interface RecommendationResponse {
  recommendations: Array<{
    item: Item;
    score: number;
    reasoning?: string;
  }>;
  modelId: string;
}

export interface RecommenderConfig {
  llamaModelPath: string;
  cacheSize?: number;
  falsePositiveRate?: number;
} 