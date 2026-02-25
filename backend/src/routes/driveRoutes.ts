import express from 'express';
import { getGoogleDriveFolders, triggerFolderIngestion } from '../controllers/drive.controller.js';

const router = express.Router();

router.post('/folders', getGoogleDriveFolders);
router.post('/ingest', triggerFolderIngestion);

export default router;
