import type { Request, Response } from 'express';
import { listFolders } from '../services/googleDrive.service.js';
import { ingestFolder } from '../services/ingestion.service.js';
import { getTokens } from '../db/tokenStore.js';

export async function getGoogleDriveFolders(req: Request, res: Response) {
  try {
    const tokens = getTokens();
    console.log('DEBUG: Fetching folders. Tokens present:', !!tokens);
    
    if (!tokens) {
      console.warn('DEBUG: No tokens found in database');
      return res.status(401).json({ error: 'Not authenticated with Google Drive' });
    }

    const folders = await listFolders(tokens);
    console.log(`DEBUG: Successfully fetched ${folders.length} folders`);
    res.json({ folders });
  } catch (error) {
    console.error('CRITICAL: Failed to list folders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch folders from Google Drive',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function triggerFolderIngestion(req: Request, res: Response) {
  try {
    const { folderId, collectionName, incremental } = req.body;
    const tokens = req.body.tokens || getTokens();
    
    if (!tokens || !folderId) {
      return res.status(400).json({ error: 'Authentication and folderId are required' });
    }

    const results = await ingestFolder(tokens, folderId, collectionName || 'documents', incremental);
    res.json({ message: 'Ingestion completed', results });
  } catch (error) {
    console.error('Ingestion failed:', error);
    res.status(500).json({ error: 'Failed to ingest folder' });
  }
}
