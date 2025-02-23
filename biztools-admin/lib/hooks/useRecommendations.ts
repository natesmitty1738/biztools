import { useState, useCallback } from 'react';
import { RecommendationItem, RecommendationRequest, RecommendationResponse } from '../recommender/types';

interface UseRecommendationsOptions {
  onError?: (error: Error) => void;
}

interface UseRecommendationsReturn {
  recommendations: RecommendationItem[];
  isLoading: boolean;
  error: Error | null;
  getRecommendations: (request: RecommendationRequest) => Promise<void>;
  recordInteraction: (userId: string, itemId: string, interactionType: string) => Promise<void>;
}

export function useRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRecommendations = useCallback(async (request: RecommendationRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/recommender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }

      const data: RecommendationResponse = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get recommendations');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options.onError]);

  const recordInteraction = useCallback(async (
    userId: string,
    itemId: string,
    interactionType: string
  ) => {
    try {
      const response = await fetch('/api/recommender', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          itemId,
          interactionType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record interaction: ${response.statusText}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record interaction');
      options.onError?.(error);
      throw error;
    }
  }, [options.onError]);

  return {
    recommendations,
    isLoading,
    error,
    getRecommendations,
    recordInteraction,
  };
} 