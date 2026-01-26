import Chat from '../models/Chat.js';
import Ticket from '../models/Ticket.js';
import { analyzeConversation, generateMockResponse } from '../services/aiService.js';

// @desc    Start or continue a chat session
// @route   POST /api/chat/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user.id;

    let chat;

    // Find existing chat or create a new one
    if (chatId) {
      chat = await Chat.findById(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat not found'
        });
      }

      // Verify chat belongs to user
      if (chat.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this chat'
        });
      }
    } else {
      // Create a new chat
      chat = await Chat.create({
        userId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer support assistant. Answer user questions clearly and concisely. If you cannot answer a question or the question requires specialized knowledge, indicate that the issue needs to be escalated to a support representative.'
          }
        ]
      });
    }

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Build chat history:
    // - last 5 messages
    // - each content trimmed to 1000 chars
    const chatHistory = chat.messages
      .slice(-5)
      .map(msg => ({
        role: msg.role,
        content: msg.content.length > 1000
          ? msg.content.slice(0, 1000)
          : msg.content
      }));

    // Generate mock AI response (instead of calling OpenAI)
    // let aiResponse = generateMockResponse(message, chatHistory);
    let aiResponse = "";

    // Check if the response indicates escalation is needed
    const analyzeResult = await analyzeConversation(chatHistory, message);
    if (analyzeResult === true) {
      aiResponse = "I understand this is a complex issue that requires specialized attention. I'm not able to fully address this myself, so I'll create a support ticket to connect you with one of our expert team members who can provide the detailed assistance you need.";
      console.log('🎫 Escalating to ticket...');

      // Mark chat for escalation
      chat.escalatedToTicket = true;

      // Create a ticket from the chat
      const ticket = await Ticket.create({
        userId,
        chatId: chat._id,
        title: `Support Request: ${message.substring(0, 50)}...`,
        description: `Chat escalated to ticket. User message: ${message}\n\nAI Response: ${aiResponse}`,
        category: 'other', // Will be classified by AI later
        priority: 'medium'
      });

      // Link ticket to chat
      chat.ticketId = ticket._id;
    } else {
      aiResponse = analyzeResult; // use the AI's response if no escalation needed
    }

    // Add AI response to chat
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    });

    await chat.save();

    return res.status(200).json({
        success: true,
        data: {
          chat,
          escalated: analyzeResult === true,
          ticketId: analyzeResult === true ? chat.ticketId : null
        }
      });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
    });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/:chatId
// @access  Private
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Verify chat belongs to user
    if (chat.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};