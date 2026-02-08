import express from 'express';
import {
  getAllStaff,
  getStaffById,
  updateStaff,
  createStaff,
  deleteStaff,
  getMyStats
} from '../controllers/staffController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-stats', protect, authorize('staff', 'admin'), getMyStats);
router.get('/', protect, authorize('admin', 'staff'), getAllStaff);
router.get('/:id', protect, authorize('admin'), getStaffById);
router.put('/:id', protect, authorize('admin'), updateStaff);
router.post('/', protect, authorize('admin'), createStaff);
router.delete('/:id', protect, authorize('admin'), deleteStaff);

export default router;