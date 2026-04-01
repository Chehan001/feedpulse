import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', login);

export default authRouter;
