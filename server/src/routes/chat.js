import express from 'express';
import { sendMessage, getChatById, getUserChats } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/message', protect, sendMessage);
router.get('/:chatId', protect, getChatById);
router.get('/', protect, getUserChats);

export default router;