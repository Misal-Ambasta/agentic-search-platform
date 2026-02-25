import express from 'express';
import { startAgentSession, getAgentSession } from '../controllers/agent.controller.js';

const router = express.Router();

router.post('/start', startAgentSession);
router.get('/:sessionId', getAgentSession);

export default router;
