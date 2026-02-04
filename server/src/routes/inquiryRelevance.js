import express from 'express';
import {
  getAllInquiryRelevance,
  getInquiryRelevanceById,
  updateInquiryRelevance
} from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/auth.js';


const router = express.Router();

// @route /api/inquiry-relevance
router.get('/', protect, authorize('admin'), getAllInquiryRelevance);
router.get('/:id', protect, authorize('admin'), getInquiryRelevanceById);
router.put('/:id', protect, authorize('admin'), updateInquiryRelevance);

export default router;