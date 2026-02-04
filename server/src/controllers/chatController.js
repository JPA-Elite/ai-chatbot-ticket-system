import Chat from '../models/Chat.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { analyzeConversation } from '../services/aiService.js';
import { sendTicketCreatedToStaff } from '../services/emailService.js';

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

    const chatHistory = chat.messages
      .slice(-5)
      .map(msg => ({
        role: msg.role,
        content: msg.content.length > 1000
          ? msg.content.slice(0, 1000)
          : msg.content
      }));

    let aiResponse = "";

    const analyzeResult = await analyzeConversation(chatHistory, message);
    if (analyzeResult === true) {
      aiResponse = "I understand this is a complex issue that requires specialized attention. I'm not able to fully address this myself, so I'll create a support ticket to connect you with one of our expert team members who can provide the detailed assistance you need.";
      chat.escalatedToTicket = true;

      const ticket = await Ticket.create({
        userId,
        chatId: chat._id,
        title: `${message.substring(0, 50)}...`,
        description: `Chat escalated to ticket. User message: ${message}\n\nAI Response: ${aiResponse}`,
        category: 'other',
        priority: 'medium'
      });

      chat.ticketId = ticket._id;

      try {
        const student = await User.findById(userId).select('name email');
        if (student) {
          await sendTicketCreatedToStaff(ticket, student.name, student.email);
        }
      } catch (emailError) {
        console.error('Error sending ticket notification email:', emailError);
      }
    } else {
      aiResponse = analyzeResult;
    }

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

export const deleteAllChats = async (req, res) => {
  try {
    const result = await Chat.deleteMany({ userId: req.user.id });

    console.log(`Deleted ${result.deletedCount} chats for user ${req.user.id}`);

    return res.status(200).json({
      success: true,
      message: 'All chats deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all chats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};