import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback, checkAuthStatus, disconnectGoogleDrive } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/google', getGoogleAuthUrl);
router.get('/callback', handleGoogleCallback);
router.get('/status', checkAuthStatus);
router.post('/disconnect', disconnectGoogleDrive);

export default router;
