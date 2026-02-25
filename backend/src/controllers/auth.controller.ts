import type { Request, Response } from 'express';
import { getAuthUrl, getTokens } from '../services/googleDrive.service.js';
import { saveTokens } from '../db/tokenStore.js';

export function getGoogleAuthUrl(req: Request, res: Response) {
  const url = getAuthUrl();
  res.json({ url });
}

export async function handleGoogleCallback(req: Request, res: Response) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const tokens = await getTokens(code as string);
    // Persist tokens in database
    saveTokens(tokens);
    
    res.json({ message: 'Success', tokens });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
}
