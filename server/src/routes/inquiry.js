import express from 'express';
import {
  getAllInquiry,
  getInquiryById,
  updateInquiry,
  createInquiry,
  deleteInquiry,
  importInquiryFile
} from '../controllers/inquiryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../utils/utils.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllInquiry);
router.get('/:id', protect, authorize('admin'), getInquiryById);
router.put('/:id', protect, authorize('admin'), updateInquiry);
router.post('/', protect, authorize('admin'), createInquiry);
router.delete('/:id', protect, authorize('admin'), deleteInquiry);
router.post(
  '/import',
  protect,
  authorize('admin'),
  upload.single('file'),
  importInquiryFile
);

export default router;