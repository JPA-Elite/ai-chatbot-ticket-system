import express from 'express';
import {
  getAllTickets,
  getUserTickets,
  getTicketById,
  updateTicket,
  addTicketMessage,
  classifyTicketAI
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllTickets);
router.get('/user', protect, getUserTickets);
router.get('/:id', protect, getTicketById);
router.put('/:id', protect, authorize('admin'), updateTicket);
router.post('/:id/message', protect, addTicketMessage);
router.post('/:id/classify', protect, authorize('admin'), classifyTicketAI);

export default router;