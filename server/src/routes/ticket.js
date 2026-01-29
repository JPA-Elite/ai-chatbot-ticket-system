import express from 'express';
import {
  getAllTickets,
  getUserTickets,
  getTicketById,
  updateTicket,
  addTicketMessage,
  classifyTicketAI,
  acceptTicket,
  endConversation
} from '../controllers/ticketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'staff'), getAllTickets);
router.get('/user', protect, getUserTickets);
router.get('/:id', protect, getTicketById);
router.put('/:id', protect, authorize('admin'), updateTicket);
router.post('/:id/message', protect, addTicketMessage);
router.post('/:id/classify', protect, authorize('admin'), classifyTicketAI);
router.post('/:id/accept', protect, authorize('admin', 'staff'), acceptTicket);
router.post('/:id/end', protect, authorize('admin', 'staff'), endConversation);

export default router;