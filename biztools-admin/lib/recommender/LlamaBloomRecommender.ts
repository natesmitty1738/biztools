import { PrismaClient } from '@prisma/client';
import { 
  Item, 
  UserInteraction, 
  RecommendationRequest, 
  RecommendationResponse,
  RecommenderConfig 
} from './types';

export class LlamaBloomRecommender {
  private static instance: LlamaBloomRecommender;
  private prisma: PrismaClient;
  private config: RecommenderConfig;
  private modelLoaded: boolean = false;

  private constructor(config: RecommenderConfig) {
    this.config = config;
    this.prisma = new PrismaClient();
  }

  public static getInstance(config?: RecommenderConfig): LlamaBloomRecommender {
    if (!LlamaBloomRecommender.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization');
      }
      LlamaBloomRecommender.instance = new LlamaBloomRecommender(config);
    }
    return LlamaBloomRecommender.instance;
  }

  public async initialize(): Promise<void> {
    if (this.modelLoaded) return;
    
    try {
      // Initialize Python/C++ backend
      const response = await fetch('/api/recommender/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize recommender backend');
      }

      this.modelLoaded = true;
    } catch (error) {
      console.error('Failed to initialize recommender:', error);
      throw error;
    }
  }

  public async addItem(item: Item): Promise<void> {
    try {
      // Store in database
      await this.prisma.item.create({
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          categories: item.categories,
          features: item.features,
        },
      });

      // Update recommender backend
      await fetch('/api/recommender/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
    } catch (error) {
      console.error('Failed to add item:', error);
      throw error;
    }
  }

  public async addUserInteraction(interaction: UserInteraction): Promise<void> {
    try {
      // Store in database
      await this.prisma.userInteraction.create({
        data: {
          userId: interaction.userId,
          itemId: interaction.itemId,
          type: interaction.interactionType,
          timestamp: interaction.timestamp,
        },
      });

      // Update recommender backend
      await fetch('/api/recommender/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      console.error('Failed to add user interaction:', error);
      throw error;
    }
  }

  public async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      // Get user's recent interactions
      const recentInteractions = await this.prisma.userInteraction.findMany({
        where: {
          userId: request.userId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });

      // Get recommendations from backend
      const response = await fetch('/api/recommender/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          recentInteractions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  public async getSimilarItems(itemId: string, limit: number = 10): Promise<Item[]> {
    try {
      const response = await fetch(`/api/recommender/similar-items/${itemId}?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get similar items');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get similar items:', error);
      throw error;
    }
  }
} 
} 