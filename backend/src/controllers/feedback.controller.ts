import { Request, Response } from 'express';
import Feedback, { IFeedback } from '../models/Feedback.js';
import { analyzeFeedback } from '../services/gemini.service.js';

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    // Validation
    if (!title || title.length > 120) {
      return res.status(400).json({ success: false, error: 'Title required and max 120 chars' });
    }
    if (!description || description.length < 20) {
      return res.status(400).json({ success: false, error: 'Description must be at least 20 characters' });
    }
    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    // Call AI analysis
    const aiAnalysis = await analyzeFeedback(title, description, category);

    const newFeedback: any = {
      title,
      description,
      category,
      submitterName,
      submitterEmail,
      status: 'New',
    };

    if (aiAnalysis) {
      newFeedback.ai_category = aiAnalysis.category;
      newFeedback.ai_sentiment = aiAnalysis.sentiment;
      newFeedback.ai_priority = aiAnalysis.priority_score;
      newFeedback.ai_summary = aiAnalysis.summary;
      newFeedback.ai_tags = aiAnalysis.tags;
      newFeedback.ai_processed = true;
    }

    const savedFeedback = await Feedback.create(newFeedback);

    res.status(201).json({ 
      success: true, 
      data: savedFeedback, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const { category, status, search, sort = '-createdAt', page = '1', limit = '10' } = req.query;

    const query: any = {};
    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ai_summary: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Feedback.find(query).sort(sort as string).skip(skip).limit(limitNum),
      Feedback.countDocuments(query)
    ]);

    res.status(200).json({ 
      success: true, 
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getFeedbackById = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['New', 'In Review', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    res.status(200).json({ success: true, data: feedback, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    res.status(200).json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Requirement 4: Trend summary
export const getTrendsSummary = async (req: Request, res: Response) => {
  try {
    const recentFeedback = await Feedback.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('title description ai_summary ai_category');

    // Stats
    const totalCount = await Feedback.countDocuments();
    const resolvedCount = await Feedback.countDocuments({ status: 'Resolved' });
    const avgPriority = await Feedback.aggregate([
      { $match: { ai_priority: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$ai_priority' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems: totalCount,
        openItems: totalCount - resolvedCount,
        avgPriority: avgPriority[0]?.avg || 0,
        trendInfo: recentFeedback //  summarize display 
      },
      message: 'Dashboard statistics fetched'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
