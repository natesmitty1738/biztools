import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';

export class LlamaService {
  private static instance: LlamaService;
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private modelPath: string;

  private constructor() {
    this.modelPath = path.join(process.cwd(), 'models', 'llama-2-7b-chat.gguf');
  }

  public static getInstance(): LlamaService {
    if (!LlamaService.instance) {
      LlamaService.instance = new LlamaService();
    }
    return LlamaService.instance;
  }

  public async initialize() {
    if (!this.model) {
      this.model = new LlamaModel({
        modelPath: this.modelPath,
        contextSize: 2048,
        batchSize: 512,
        threads: 4,
        embedding: true,
      });
      this.context = new LlamaContext({ model: this.model });
    }
  }

  public async getRecommendations(
    userContext: string,
    items: Array<{ id: string; title: string; description: string; category: string }>,
    n: number = 5
  ) {
    await this.initialize();
    if (!this.context) throw new Error('LLaMA context not initialized');

    const prompt = `Given the following user context and items, recommend the top ${n} most relevant items. Provide reasoning for each recommendation.

User Context:
${userContext}

Available Items:
${items.map(item => `- ${item.title} (${item.category}): ${item.description}`).join('\n')}

Recommendations:`;

    const session = new LlamaChatSession({
      context: this.context,
      systemPrompt: "You are a recommendation system expert. Provide clear, concise recommendations with brief explanations.",
    });

    const response = await session.prompt(prompt);
    
    // Parse response to extract recommendations
    const recommendations = this.parseRecommendations(response, items);
    return recommendations.slice(0, n);
  }

  public async getSimilarItems(
    targetItem: { id: string; title: string; description: string; category: string },
    items: Array<{ id: string; title: string; description: string; category: string }>,
    n: number = 5
  ) {
    await this.initialize();
    if (!this.context) throw new Error('LLaMA context not initialized');

    const prompt = `Given the following target item and a list of other items, find the ${n} most similar items. Explain why they are similar.

Target Item:
${targetItem.title} (${targetItem.category}): ${targetItem.description}

Available Items:
${items.map(item => `- ${item.title} (${item.category}): ${item.description}`).join('\n')}

Similar Items:`;

    const session = new LlamaChatSession({
      context: this.context,
      systemPrompt: "You are a recommendation system expert. Find similar items based on content, category, and semantic meaning.",
    });

    const response = await session.prompt(prompt);
    
    // Parse response to extract similar items
    const similarItems = this.parseSimilarItems(response, items);
    return similarItems.slice(0, n);
  }

  private parseRecommendations(
    response: string,
    items: Array<{ id: string; title: string; description: string; category: string }>
  ) {
    const recommendations: Array<{
      item: typeof items[0];
      score: number;
      reasoning: string;
    }> = [];

    // Split response into lines and look for item titles
    const lines = response.split('\n');
    let currentItem: typeof items[0] | null = null;
    let currentReasoning = '';

    for (const line of lines) {
      // Look for item titles in the response
      const item = items.find(i => line.includes(i.title));
      if (item) {
        // If we found a new item, save the previous one
        if (currentItem) {
          recommendations.push({
            item: currentItem,
            score: this.calculateScore(currentReasoning),
            reasoning: currentReasoning.trim(),
          });
        }
        currentItem = item;
        currentReasoning = '';
      } else if (currentItem) {
        currentReasoning += line + '\n';
      }
    }

    // Add the last item
    if (currentItem) {
      recommendations.push({
        item: currentItem,
        score: this.calculateScore(currentReasoning),
        reasoning: currentReasoning.trim(),
      });
    }

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private parseSimilarItems(
    response: string,
    items: Array<{ id: string; title: string; description: string; category: string }>
  ) {
    const similarItems: Array<{
      item: typeof items[0];
      score: number;
      reasoning: string;
    }> = [];

    // Similar parsing logic to parseRecommendations
    const lines = response.split('\n');
    let currentItem: typeof items[0] | null = null;
    let currentReasoning = '';

    for (const line of lines) {
      const item = items.find(i => line.includes(i.title));
      if (item) {
        if (currentItem) {
          similarItems.push({
            item: currentItem,
            score: this.calculateScore(currentReasoning),
            reasoning: currentReasoning.trim(),
          });
        }
        currentItem = item;
        currentReasoning = '';
      } else if (currentItem) {
        currentReasoning += line + '\n';
      }
    }

    if (currentItem) {
      similarItems.push({
        item: currentItem,
        score: this.calculateScore(currentReasoning),
        reasoning: currentReasoning.trim(),
      });
    }

    return similarItems.sort((a, b) => b.score - a.score);
  }

  private calculateScore(reasoning: string): number {
    // Simple scoring based on sentiment and confidence markers in the reasoning
    const positiveMarkers = [
      'perfect', 'excellent', 'highly', 'very', 'strong',
      'great', 'ideal', 'perfect', 'exactly', 'definitely'
    ];
    const negativeMarkers = [
      'might', 'could', 'perhaps', 'maybe', 'possibly',
      'somewhat', 'slight', 'minor', 'weak', 'not'
    ];

    let score = 0.5; // Start with neutral score
    
    // Count markers
    const posCount = positiveMarkers.filter(marker => 
      reasoning.toLowerCase().includes(marker)
    ).length;
    
    const negCount = negativeMarkers.filter(marker => 
      reasoning.toLowerCase().includes(marker)
    ).length;

    // Adjust score based on markers
    score += (posCount * 0.1);
    score -= (negCount * 0.1);

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
} 