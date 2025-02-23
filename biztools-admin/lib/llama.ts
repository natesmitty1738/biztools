import { LlamaContext, LlamaModel as Llama } from 'node-llama-cpp'
import { Item, ClickEvent } from '@prisma/client'

interface ItemWithClicks extends Item {
  clickEvents: ClickEvent[]
}

interface Recommendation {
  id: string
  title: string
  description: string
  category: string
  score: number
  clicks: number
  lastClicked: Date | null
  attributes: Record<string, any>
}

export class LlamaModel {
  private model: Llama | null = null
  private context: LlamaContext | null = null

  async initialize() {
    if (!this.model) {
      this.model = new Llama({
        modelPath: process.env.LLAMA_MODEL_PATH || './models/llama-2-7b-chat.gguf',
        contextSize: 2048,
        batchSize: 512,
        threads: 4,
        embedding: true,
      })
      this.context = new LlamaContext({ model: this.model })
    }
  }

  private async getItemEmbedding(item: Item): Promise<number[]> {
    await this.initialize()
    if (!this.model) throw new Error('Model not initialized')

    // Create a rich text representation of the item
    const itemText = `
      Title: ${item.title}
      Description: ${item.description}
      Category: ${item.category}
      Attributes: ${JSON.stringify(item.attributes)}
    `

    // Get embedding from LLaMA
    return await this.model.embed(itemText)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (normA * normB)
  }

  private calculateRecencyScore(lastClicked: Date | null): number {
    if (!lastClicked) return 0
    const now = new Date()
    const hoursSinceClick = (now.getTime() - lastClicked.getTime()) / (1000 * 60 * 60)
    return Math.exp(-hoursSinceClick / 24) // Decay over 24 hours
  }

  async getRecommendations(
    items: ItemWithClicks[],
    modelData: any,
    limit: number = 10
  ): Promise<Recommendation[]> {
    await this.initialize()
    if (!this.model) throw new Error('Model not initialized')

    // Get embeddings for all items
    const itemEmbeddings = await Promise.all(
      items.map(item => this.getItemEmbedding(item))
    )

    // Calculate scores based on embeddings and click data
    const scores = items.map((item, i) => {
      const embeddingSimilarity = this.cosineSimilarity(
        itemEmbeddings[i],
        modelData.targetEmbedding
      )
      const recencyScore = this.calculateRecencyScore(item.lastClicked)
      const clickScore = Math.log1p(item.clicks) / Math.log1p(Math.max(...items.map(i => i.clicks)))

      // Combine scores with weights
      const score = (
        embeddingSimilarity * 0.5 +
        recencyScore * 0.3 +
        clickScore * 0.2
      )

      return {
        ...item,
        score
      }
    })

    // Sort by score and return top N
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...item }) => ({
        ...item,
        score
      }))
  }

  async trainModel(items: ItemWithClicks[]): Promise<any> {
    await this.initialize()
    if (!this.model) throw new Error('Model not initialized')

    // Calculate target embedding based on successful items
    const successfulItems = items.filter(item => item.clicks > 0)
    const embeddings = await Promise.all(
      successfulItems.map(item => this.getItemEmbedding(item))
    )

    // Weight embeddings by click count
    const totalClicks = successfulItems.reduce((sum, item) => sum + item.clicks, 0)
    const weightedEmbedding = embeddings[0].map((_, i) => 
      embeddings.reduce((sum, emb, j) => 
        sum + (emb[i] * (successfulItems[j].clicks / totalClicks)), 
      0)
    )

    return {
      targetEmbedding: weightedEmbedding,
      metadata: {
        trainedOn: new Date(),
        itemCount: items.length,
        successfulItemCount: successfulItems.length,
        totalClicks
      }
    }
  }
} 