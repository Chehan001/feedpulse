import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface IFeedbackAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number; // 1-10
  summary: string;
  tags: string[];
}

export const analyzeFeedback = async (
  title: string,
  description: string,
  category: string
): Promise<IFeedbackAnalysis | null> => {
  const prompt = `
    Analyse this product feedback. Return ONLY valid JSON with these fields:
    {
      "category": "...", // Refined Feature Request | Bug | Improvement | Other
      "sentiment": "...", // Positive | Neutral | Negative
      "priority_score": ..., // 1 (low) to 10 (critical)
      "summary": "...", // One sentence summary
      "tags": ["...", "..."] // A few relevant tags
    }

    Feedback Details:
    Title: ${title}
    Initial Category: ${category}
    Description: ${description}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Normalize values if needed
      return {
        category: parsed.category || category,
        sentiment: ['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment) ? parsed.sentiment : 'Neutral',
        priority_score: Math.min(10, Math.max(1, parsed.priority_score || 1)),
        summary: parsed.summary || description.substring(0, 100),
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    }
    return null;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null; // Requirement 2.3 - handle gracefully, feedback still saved
  }
};
