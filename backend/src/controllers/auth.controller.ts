import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret_fallback',
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true, 
      data: { token, email: user.email },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Seeding function if no users exist
export const seedAdmin = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@feedpulse.com';
      const password = process.env.ADMIN_PASSWORD || 'password123';
      const admin = new User({ email, password });
      await admin.save();
      console.log('Seed: Created initial admin account', email);
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
};
