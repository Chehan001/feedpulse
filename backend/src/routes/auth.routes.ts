import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', login);

export default authRouter;
