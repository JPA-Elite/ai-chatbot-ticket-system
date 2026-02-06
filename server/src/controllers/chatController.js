import {
  deleteAllChatsData,
  getChatByIdData,
  getUserChatsData,
  sendMessageData
} from '../services/chatService.js';
import { SERVER_ERROR_MESSAGE } from '../constants/controllerMessages.js';

// @desc    Start or continue a chat session
// @route   POST /api/chat/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const result = await sendMessageData({
      message: req.body.message,
      chatId: req.body.chatId,
      user: req.user
    });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
      error: error.message
    });
  }
};

export const getChatById = async (req, res) => {
  try {
    const result = await getChatByIdData({ chatId: req.params.chatId, user: req.user });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const result = await getUserChatsData(req.user.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const deleteAllChats = async (req, res) => {
  try {
    const result = await deleteAllChatsData(req.user.id);
    console.log(`Deleted ${result.payload.deletedCount} chats for user ${req.user.id}`);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Delete all chats error:', error);
    return res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
      error: error.message
    });
  }
};
