import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import feedbackRouter from './routes/feedback.routes';
import authRouter from './routes/auth.routes';
import { seedAdmin } from './controllers/auth.controller';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/AI_powered_product_feedback_platform';
mongoose.connect(mongoUrl)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    seedAdmin(); // Seed admin user if it doesn't exist
  })
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/feedback', feedbackRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
