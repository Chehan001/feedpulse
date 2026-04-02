import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface IFeedbackAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number; 
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
      // Normalize values 
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
    return null; 
  }
};

export const summarizeThemes = async (
  feedbackList: { title: string; description: string; category: string; ai_sentiment?: string }[]
): Promise<{ themes: { theme: string; description: string; sentiment: string; occurrence: number }[] } | null> => {
  const prompt = `
    Analyze the following list of recent product feedback items.
    Identify the top 3-5 emerging themes or most requested features.
    Return ONLY valid JSON in the exact structure below:
    {
      "themes": [
        {
          "theme": "Very short name of the theme",
          "description": "One sentence describing the pattern",
          "sentiment": "Positive|Neutral|Negative (overall sentiment for this theme)",
          "occurrence": Number of times this theme appeared
        }
      ]
    }

    Feedback Items:
    ${JSON.stringify(feedbackList)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini API Error (Themes):', error);
    return null;
  }
};
