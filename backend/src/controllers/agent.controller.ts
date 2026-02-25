import type { Request, Response } from 'express';
import { startAgent } from '../services/agent.service.js';
import { getSession } from '../db/sessionStore.js';

export async function startAgentSession(req: Request, res: Response) {
  const { task } = req.body;
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'task is required and must be a string' });
  }
  try {
    const session = await startAgent(task);
    res.status(201).json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}

export function getAgentSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'invalid or missing sessionId' });
  }
  const s = getSession(sessionId);
  if (!s) return res.status(404).json({ error: 'not found' });
  return res.json(s);
}
