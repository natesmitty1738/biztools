/**
 * Example of integrating the LlamaBloomRecommender with Next.js
 * 
 * This example shows how to:
 * 1. Create an API route for recommendations
 * 2. Handle recommendation requests
 * 3. Record user interactions
 */

// File: app/api/recommender/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecommenderService } from '@/lib/recommender';

// Singleton recommender service instance
let recommenderService: RecommenderService | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const query = searchParams.get('query');
  const limit = Number(searchParams.get('limit') || '10');

  if (!userId) {
    return NextResponse.json({ error: 'Missing required parameter: userId' }, { status: 400 });
  }

  // Initialize recommender if needed
  if (!recommenderService) {
    recommenderService = await RecommenderService.getInstance();
  }

  try {
    // Get recommendations
    const recommendations = await recommenderService.getRecommendations(userId, query, limit);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

// File: app/api/recommender/click/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecommenderService } from '@/lib/recommender';

// Singleton recommender service instance (same instance as in the other route)
let recommenderService: RecommenderService | null = null;

export async function POST(request: Request) {
  try {
    const { userId, itemId } = await request.json();
    
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or itemId' },
        { status: 400 }
      );
    }

    // Initialize recommender if needed
    if (!recommenderService) {
      recommenderService = await RecommenderService.getInstance();
    }

    // Record the interaction in the database
    await prisma.clickEvent.create({
      data: {
        itemId,
        userId,
        timestamp: new Date(),
      },
    });

    // Update item click count
    await prisma.item.update({
      where: { id: itemId },
      data: {
        clicks: { increment: 1 },
        lastClicked: new Date(),
      },
    });

    // Record the interaction in the recommender
    await recommenderService.recordInteraction(userId, itemId, 'click', Date.now());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record click' },
      { status: 500 }
    );
  }
}

// File: lib/recommender.ts
import path from 'path';
import { LlamaBloomRecommender } from 'biztools-recommender';
import { prisma } from './prisma';

export class RecommenderService {
  private static instance: RecommenderService;
  private recommender: any; // LlamaBloomRecommender instance
  private modelPath: string;
  private initialized: boolean = false;

  private constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  public static async getInstance(): Promise<RecommenderService> {
    if (!RecommenderService.instance) {
      // Get model path from environment variable or use a default
      const modelPath = process.env.LLAMA_MODEL_PATH || path.join(process.cwd(), 'models', 'llama-latest');
      RecommenderService.instance = new RecommenderService(modelPath);
      await RecommenderService.instance.initialize();
    }
    return RecommenderService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the recommender
      this.recommender = new LlamaBloomRecommender(
        this.modelPath,
        10000, // cache size
        0.01,  // false positive rate
        512    // context size
      );

      // Load existing items from the database
      const items = await prisma.item.findMany();
      for (const item of items) {
        this.recommender.add_item(
          item.id,
          item.title,
          item.description,
          [item.category], // Convert category string to array
          Object.keys(item.attributes as any) // Convert attributes object to array of features
        );
      }

      // Load recent interactions from the database
      const recentClicks = await prisma.clickEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10000 // Limit to recent interactions
      });

      for (const click of recentClicks) {
        if (click.userId) {
          this.recommender.add_user_interaction(
            click.userId,
            click.itemId,
            'click',
            click.timestamp.getTime()
          );
        }
      }

      this.initialized = true;
      console.log('Recommender service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize recommender:', error);
      throw error;
    }
  }

  public async getRecommendations(userId: string, context?: string | null, limit: number = 10): Promise<any[]> {
    if (!this.initialized) await this.initialize();
    return this.recommender.recommend(userId, context, limit);
  }

  public async getSimilarItems(itemId: string, limit: number = 10): Promise<any[]> {
    if (!this.initialized) await this.initialize();
    return this.recommender.similar_items(itemId, limit);
  }

  public async recordInteraction(userId: string, itemId: string, type: string, timestamp: number): Promise<void> {
    if (!this.initialized) await this.initialize();
    this.recommender.add_user_interaction(userId, itemId, type, timestamp);
  }
}

// Example component usage in a React component (app/components/ProductRecommendations.tsx)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Recommendation {
  id: string;
  title: string;
  score: number;
  reason: string;
}

export function ProductRecommendations() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch recommendations if user is logged in
    if (!session?.user?.id) return;

    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recommender?userId=${session.user.id}`);
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        const data = await res.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [session]);

  const handleItemClick = async (itemId: string) => {
    if (!session?.user?.id) return;

    // Record the click
    try {
      await fetch('/api/recommender/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          itemId: itemId,
        }),
      });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (recommendations.length === 0) {
    return <div>No recommendations available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec) => (
        <div 
          key={rec.id} 
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          onClick={() => handleItemClick(rec.id)}
        >
          <h3 className="font-bold text-lg">{rec.title}</h3>
          <p className="text-gray-600 text-sm">{rec.reason}</p>
        </div>
      ))}
    </div>
  );
} 