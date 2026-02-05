import Chat from '../models/Chat.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { analyzeConversation, matchResponseLanguage } from '../services/aiService.js';
import { sendTicketCreatedToStaff } from '../services/emailService.js';

const pickBestTag = async (message) => {
  const m = String(message || '').toLowerCase();

  const staff = await User.find({
    role: { $in: ['admin', 'staff'] },
    tags: { $exists: true, $ne: [] }
  }).select('tags');

  const all = staff
    .flatMap(s => (s.tags || []))
    .map(t => String(t).trim())
    .filter(Boolean);

  const unique = Array.from(new Set(all));
  const matches = unique
    .map(t => ({ tag: t, hit: m.includes(t.toLowerCase()) }))
    .filter(x => x.hit)
    .sort((a, b) => b.tag.length - a.tag.length);

  return matches.length ? matches[0].tag : 'General';
};

const formatStaffSelectionMessage = (staffList = []) => {
  const uniqueStaff = [];
  const seen = new Set();

  for (const staff of staffList) {
    const key = String(staff._id);
    if (seen.has(key)) continue;
    seen.add(key);

    uniqueStaff.push({
      name: staff.name || 'Unknown Staff',
      role: staff.role || 'staff',
      email: staff.email || 'No email',
      concerns: (Array.isArray(staff.tags) ? staff.tags : []).filter(Boolean)
    });
  }

  if (!uniqueStaff.length) {
    return 'I can help you file a support ticket. Please tell me the specific concern (for example: Enrollment, Admission, TCG, Thesis, or AMIS concerns) so I can assign it to the right staff member.';
  }

  const lines = uniqueStaff.slice(0, 8).map((staff, index) => {
    const concernPreview = staff.concerns.slice(0, 4).join(', ');
    const concernText = concernPreview ? ` | concerns: ${concernPreview}` : '';
    return `${index + 1}. ${staff.name} (${staff.role}) - ${staff.email}${concernText}`;
  });

  return [
    'I can help you file a support ticket.',
    'Please choose one of the following staff members and share your concern category so I can route your ticket correctly:',
    ...lines,
    '',
    "Example reply: 'Please assign this to Karen C. De Vera for Student Records.'"
  ].join('\n');
};

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
    let escalated = false;
    let ticketId = null;

    const normalize = (s = "") =>
      String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const hasTicketGuidanceIntent = (text = "") => {
      const msg = normalize(text);

      const asksTicketAction =
        (msg.includes("file") || msg.includes("create") || msg.includes("open") || msg.includes("submit"))
        && msg.includes("ticket");

      const asksTicketHowTo =
        (msg.includes("how") || msg.includes("guide") || msg.includes("steps") || msg.includes("process"))
        && msg.includes("ticket");

      const asksEscalation = msg.includes("escalat") || msg.includes("human agent") || msg.includes("support staff");

      return asksTicketAction || asksTicketHowTo || asksEscalation;
    };

    const scoreTag = (tag, text) => {
      const t = normalize(tag);
      if (!t) return 0;

      const words = t.split(" ").filter(Boolean);
      let score = 0;

      for (const w of words) {
        if (w.length >= 3 && text.includes(w)) score += 1;
      }

      if (text.includes(t)) score += 3;
      return score;
    };

    const findBestStaffMatch = (staffList = [], studentText = "") => {
      let best = { staff: null, tag: "", score: 0 };

      for (const staff of staffList) {
        const tags = Array.isArray(staff.tags) ? staff.tags : [];
        for (const tag of tags) {
          const s = scoreTag(tag, studentText);
          if (s > best.score) best = { staff, tag, score: s };
        }
      }

      return best;
    };

    const getActiveStaffWithTags = async () => User.find({
      role: { $in: ["staff", "admin"] },
      isActive: true,
      tags: { $exists: true, $ne: [] },
    }).select("_id name email tags role");

    const analyzeResult = await analyzeConversation(chatHistory, message);
    const shouldOfferStaffSelection = hasTicketGuidanceIntent(message);

    if (analyzeResult === true || shouldOfferStaffSelection) {
      const studentText = normalize(message);
      const staffList = await getActiveStaffWithTags();
      const best = findBestStaffMatch(staffList, studentText);

      if (!best.staff || best.score === 0) {
        aiResponse = formatStaffSelectionMessage(staffList);
      } else {
        aiResponse = "I understand this is a complex issue that requires specialized attention. I'm not able to fully address this myself, so I'll create a support ticket to connect you with one of our expert team members who can provide the detailed assistance you need.";
        chat.escalatedToTicket = true;
        escalated = true;

        const ticket = await Ticket.create({
          userId,
          chatId: chat._id,
          title: `${message.substring(0, 50)}...`,
          description: `Chat escalated to ticket. User message: ${message}

AI Response: ${aiResponse}`,
          category: 'other',
          priority: 'medium',
          assignedTo: best.staff._id,
          tag: best.tag || "",
          status: 'pending'
        });

        chat.ticketId = ticket._id;
        ticketId = ticket._id;

        try {
          const student = await User.findById(userId).select('name email');

          const matchedStaffEmail =
            ticket.assignedTo
              ? (await User.findById(ticket.assignedTo).select('email'))?.email
              : null;

          if (student) {
            if (matchedStaffEmail) {
              await sendTicketCreatedToStaff(ticket, student.name, student.email, [matchedStaffEmail]);
              console.log(`Ticket created and notification sent to assigned staff: ${matchedStaffEmail}`);
            } else {
              await sendTicketCreatedToStaff(ticket, student.name, student.email);
              console.log('Ticket created but no specific staff assigned, notification sent to general staff inbox');
            }
          }
        } catch (emailError) {
          console.error('Error sending ticket notification email:', emailError);
        }
      }
    } else {
      aiResponse = analyzeResult;
    }

    // aiResponse = await matchResponseLanguage(message, aiResponse);

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
        escalated,
        ticketId
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