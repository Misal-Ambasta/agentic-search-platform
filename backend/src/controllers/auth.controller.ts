import type { Request, Response } from 'express';
import { getAuthUrl, getTokens as fetchNewTokens } from '../services/googleDrive.service.js';
import { saveTokens, getTokens as getSavedTokens, clearTokens } from '../db/tokenStore.js';

export function disconnectGoogleDrive(req: Request, res: Response) {
  clearTokens();
  res.json({ message: 'Disconnected successfully' });
}

export function getGoogleAuthUrl(req: Request, res: Response) {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Failed to generate Auth URL:', error);
    res.status(500).json({ error: String(error) });
  }
}

export async function handleGoogleCallback(req: Request, res: Response) {
  const { code } = req.query;
  console.log('DEBUG: Auth callback triggered. Code present:', !!code);
  
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const tokens = await fetchNewTokens(code as string);
    if (!tokens) {
      console.warn('DEBUG: Google returned empty tokens');
      return res.status(500).json({ error: 'Google returned empty tokens' });
    }
    
    console.log('DEBUG: Tokens successfully retrieved from Google');
    
    // Persist tokens in database
    saveTokens(tokens);
    console.log('DEBUG: Tokens saved to database');
    
    res.json({ message: 'Success', tokens });
  } catch (error: any) {
    console.error('CRITICAL: Auth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to exchange code for tokens',
      details: error.response?.data || error.message 
    });
  }
}
export function checkAuthStatus(req: Request, res: Response) {
  const tokens = getSavedTokens();
  res.json({ isConnected: !!tokens });
}
