import express from 'express';
import { sendMessage, getChatById, getUserChats, deleteAllChats } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/message', protect, sendMessage);
router.delete('/all', protect, deleteAllChats);
router.get('/:chatId', protect, getChatById);
router.get('/', protect, getUserChats);

export default router;