import type { Request, Response } from 'express';
import { listFolders } from '../services/googleDrive.service.js';
import { ingestFolder } from '../services/ingestion.service.js';

export async function getGoogleDriveFolders(req: Request, res: Response) {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: 'Tokens are required' });

  try {
    const folders = await listFolders(tokens);
    res.json(folders);
  } catch (error) {
    console.error('Failed to list folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders from Google Drive' });
  }
}

export async function triggerFolderIngestion(req: Request, res: Response) {
  const { tokens, folderId, collectionName, incremental } = req.body;
  
  if (!tokens || !folderId) {
    return res.status(400).json({ error: 'tokens and folderId are required' });
  }

  try {
    const results = await ingestFolder(tokens, folderId, collectionName || 'documents', incremental);
    res.json({ message: 'Ingestion completed', results });
  } catch (error) {
    console.error('Ingestion failed:', error);
    res.status(500).json({ error: 'Failed to ingest folder' });
  }
}
