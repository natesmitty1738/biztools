import { NextResponse } from 'next/server'
import { LlamaService } from '@/lib/llama-service'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userContext, itemIds } = await req.json()

    // Get items from database
    const items = await prisma.item.findMany({
      where: {
        id: {
          in: itemIds
        }
      }
    })

    // Get recommendations
    const llama = LlamaService.getInstance()
    const recommendations = await llama.getRecommendations(userContext, items)

    // Record recommendations in database
    const recommendationModel = await prisma.recommendationModel.create({
      data: {
        modelData: {
          userContext,
          recommendations: recommendations.map(r => ({
            itemId: r.item.id,
            score: r.score,
            reasoning: r.reasoning
          }))
        },
        isActive: true
      }
    })

    return NextResponse.json({
      recommendations,
      modelId: recommendationModel.id
    })
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    // Get all items from database
    const items = await prisma.item.findMany({
      include: {
        clickEvents: {
          orderBy: { timestamp: 'desc' },
          take: 100 // Consider last 100 clicks
        }
      }
    })

    // Get active recommendation model
    const activeModel = await prisma.recommendationModel.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // Transform items for response
    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      clicks: item.clicks,
      lastClicked: item.lastClicked,
      attributes: item.attributes,
      score: activeModel?.modelData.recommendations?.find(
        (r: any) => r.itemId === item.id
      )?.score || 0
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error getting items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get items' },
      { status: 500 }
    )
  }
} 