import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

import agentRoutes from './routes/agentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import driveRoutes from './routes/driveRoutes.js';

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3001',           // Local frontend
    'https://agentic-search-platform.vercel.app',  // Deployed frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/agent', agentRoutes);
app.use('/auth', authRoutes);
app.use('/drive', driveRoutes);

export default app;