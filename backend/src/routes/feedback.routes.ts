import { Router } from 'express';
import { 
  createFeedback, 
  getAllFeedback, 
  getFeedbackById, 
  updateFeedback, 
  deleteFeedback, 
  getTrendsSummary 
} from '../controllers/feedback.controller';
import { protect } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const feedbackRouter = Router();

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many feedback submissions from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// GET endpoints (Requirement 4)
feedbackRouter.get('/summary', protect, getTrendsSummary); // Admin trends summary
feedbackRouter.get('/', protect, getAllFeedback); // Admin view (supports filters + pagination)
feedbackRouter.get('/:id', protect, getFeedbackById); // Get detailed view

// POST feedback (Public)
feedbackRouter.post('/', feedbackLimiter, createFeedback);

// PATCH/DELETE (Admin Only)
feedbackRouter.patch('/:id', protect, updateFeedback);
feedbackRouter.delete('/:id', protect, deleteFeedback);

export default feedbackRouter;
