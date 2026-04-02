import { Router } from 'express';
import { 
  createFeedback, 
  getAllFeedback, 
  getFeedbackById, 
  updateFeedback, 
  deleteFeedback, 
  getTrendsSummary 
} from '../controllers/feedback.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const feedbackRouter = Router();

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many feedback submissions from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin routes (Protected) 
feedbackRouter.get('/summary', protect, getTrendsSummary); // Admin trends summary
feedbackRouter.get('/', protect, getAllFeedback); // Admin view 
feedbackRouter.get('/:id', protect, getFeedbackById); // Get detailed view

//public route for feedback submission 
feedbackRouter.post('/', feedbackLimiter, createFeedback);

// Admin update and delete routes   
feedbackRouter.patch('/:id', protect, updateFeedback);
feedbackRouter.delete('/:id', protect, deleteFeedback);

export default feedbackRouter;
