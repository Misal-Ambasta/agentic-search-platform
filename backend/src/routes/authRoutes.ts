import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);

export default router;
