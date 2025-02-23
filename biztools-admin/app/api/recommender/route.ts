import { NextResponse } from 'next/server';
import { LlamaBloomRecommender } from '@/lib/recommender/LlamaBloomRecommender';
import { RecommendationRequest } from '@/lib/recommender/types';

export async function POST(req: Request) {
  try {
    const requestData: RecommendationRequest = await req.json();
    
    // Validate request data
    if (!requestData.userContext?.userId) {
      return NextResponse.json(
        { error: 'Missing required field: userContext.userId' },
        { status: 400 }
      );
    }

    // Get recommendations
    const recommender = LlamaBloomRecommender.getInstance();
    const recommendations = await recommender.getRecommendations(requestData);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, itemId, interactionType } = await req.json();
    
    // Validate request data
    if (!userId || !itemId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, itemId, or interactionType' },
        { status: 400 }
      );
    }

    // Record interaction
    const recommender = LlamaBloomRecommender.getInstance();
    await recommender.addUserInteraction(userId, itemId, interactionType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record interaction' },
      { status: 500 }
    );
  }
} 