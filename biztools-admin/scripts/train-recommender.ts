import { PrismaClient } from '@prisma/client'
import { LlamaModel } from '../lib/llama'

const prisma = new PrismaClient()
const llama = new LlamaModel()

async function trainRecommenderModel() {
  try {
    console.log('Starting recommender model training...')

    // Get all items with their click events
    const items = await prisma.item.findMany({
      include: {
        clickEvents: true
      }
    })

    if (items.length === 0) {
      console.log('No items found for training')
      return
    }

    console.log(`Training on ${items.length} items...`)

    // Train the model
    const modelData = await llama.trainModel(items)

    // Create new model version
    const latestModel = await prisma.recommendationModel.findFirst({
      orderBy: { version: 'desc' }
    })

    const newVersion = (latestModel?.version || 0) + 1

    // Deactivate current model
    if (latestModel) {
      await prisma.recommendationModel.update({
        where: { id: latestModel.id },
        data: { isActive: false }
      })
    }

    // Save new model
    const newModel = await prisma.recommendationModel.create({
      data: {
        version: newVersion,
        modelData,
        isActive: true,
        metrics: {
          itemCount: items.length,
          totalClicks: items.reduce((sum, item) => sum + item.clicks, 0),
          avgClicksPerItem: items.reduce((sum, item) => sum + item.clicks, 0) / items.length,
          trainingDate: new Date().toISOString()
        }
      }
    })

    console.log(`Successfully trained and saved model version ${newVersion}`)
    console.log('Model metrics:', newModel.metrics)

  } catch (error) {
    console.error('Error training model:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run training if called directly
if (require.main === module) {
  trainRecommenderModel()
} 