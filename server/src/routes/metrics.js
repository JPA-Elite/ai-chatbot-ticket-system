import express from 'express';
import {
    fetchMetrics
} from '../controllers/pythonAPIController.js';
import { protect, authorize } from '../middleware/auth.js';


const router = express.Router();

router.get('/', protect, authorize('admin'), fetchMetrics);

export default router;