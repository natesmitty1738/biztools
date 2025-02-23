import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { itemId, timestamp, userId, metadata } = await req.json()

    // Record click event
    const clickEvent = await prisma.clickEvent.create({
      data: {
        itemId,
        timestamp: new Date(timestamp),
        userId,
        metadata: metadata || {}
      }
    })

    // Update item click count and last clicked
    await prisma.item.update({
      where: { id: itemId },
      data: {
        clicks: { increment: 1 },
        lastClicked: new Date(timestamp)
      }
    })

    return NextResponse.json(clickEvent)
  } catch (error) {
    console.error('Error recording click:', error)
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    )
  }
} 