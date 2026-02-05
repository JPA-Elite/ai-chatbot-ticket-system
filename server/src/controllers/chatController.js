import Chat from '../models/Chat.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { analyzeConversation, matchResponseLanguage } from '../services/aiService.js';
import { sendTicketCreatedToStaff } from '../services/emailService.js';
import {
  ASSIGNMENT_INTENT_REGEX,
  CHAT_HISTORY_CONTENT_LIMIT,
  CHAT_HISTORY_WINDOW,
  CHAT_SYSTEM_MESSAGE,
  DEFAULT_STAFF_EMAIL,
  DEFAULT_STAFF_NAME,
  DEFAULT_STAFF_ROLE,
  DEFAULT_TICKET_CATEGORY,
  DEFAULT_TICKET_PRIORITY,
  DEFAULT_TICKET_STATUS,
  ESCALATION_AUTO_TICKET_RESPONSE,
  STAFF_ROLES,
  STAFF_CONCERN_PREVIEW_LIMIT,
  STAFF_SELECTION_EXAMPLE_REPLY,
  STAFF_SELECTION_FALLBACK_MESSAGE,
  STAFF_SELECTION_INTRO_LINES,
  STAFF_SELECTION_MAX_RESULTS,
  STAFF_TAG_DEFAULT,
  TAG_MATCH_STOP_WORDS,
  TICKET_DESCRIPTION_TEMPLATE,
  TICKET_TITLE_PREVIEW_LENGTH
} from '../constants/constants.js';

const pickBestTag = async (message) => {
  const m = String(message || '').toLowerCase();

  const staff = await User.find({
    role: { $in: STAFF_ROLES },
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

  return matches.length ? matches[0].tag : STAFF_TAG_DEFAULT;
};

const formatStaffSelectionMessage = (staffList = []) => {
  const uniqueStaff = [];
  const seen = new Set();

  for (const staff of staffList) {
    const key = String(staff._id);
    if (seen.has(key)) continue;
    seen.add(key);

    uniqueStaff.push({
      name: staff.name || DEFAULT_STAFF_NAME,
      role: staff.role || DEFAULT_STAFF_ROLE,
      email: staff.email || DEFAULT_STAFF_EMAIL,
      concerns: (Array.isArray(staff.tags) ? staff.tags : []).filter(Boolean)
    });
  }

  if (!uniqueStaff.length) {
    return STAFF_SELECTION_FALLBACK_MESSAGE;
  }

  const lines = uniqueStaff.slice(0, STAFF_SELECTION_MAX_RESULTS).map((staff, index) => {
    const concernPreview = staff.concerns.slice(0, STAFF_CONCERN_PREVIEW_LIMIT).join(', ');
    const concernText = concernPreview ? ` | concerns: ${concernPreview}` : '';
    return `${index + 1}. ${staff.name} (${staff.role}) - ${staff.email}${concernText}`;
  });

  return [
    ...STAFF_SELECTION_INTRO_LINES,
    ...lines,
    '',
    STAFF_SELECTION_EXAMPLE_REPLY
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
            content: CHAT_SYSTEM_MESSAGE
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
      .slice(-CHAT_HISTORY_WINDOW)
      .map(msg => ({
        role: msg.role,
        content: msg.content.length > CHAT_HISTORY_CONTENT_LIMIT
          ? msg.content.slice(0, CHAT_HISTORY_CONTENT_LIMIT)
          : msg.content
      }));

    let aiResponse = "";
    let escalated = false;
    let ticketId = null;

    const normalize = (s = "") =>
      String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    const STOP_WORDS = new Set(TAG_MATCH_STOP_WORDS);

    const scoreTag = (tag, text) => {
      const t = normalize(tag);
      if (!t) return { score: 0, hasMeaningfulMatch: false };

      const words = t.split(" ").filter(Boolean);
      let score = 0;
      let meaningfulMatches = 0;

      for (const w of words) {
        const isMeaningful = w.length >= 4 && !STOP_WORDS.has(w);
        if (isMeaningful && text.includes(w)) {
          score += 1;
          meaningfulMatches += 1;
        }
      }

      const fullPhraseMatch = text.includes(t);
      if (fullPhraseMatch) score += 3;

      return {
        score,
        hasMeaningfulMatch: fullPhraseMatch || meaningfulMatches > 0
      };
    };

    const findBestStaffMatch = (staffList = [], studentText = "") => {
      let best = { staff: null, tag: "", score: 0, hasMeaningfulMatch: false };

      for (const staff of staffList) {
        const tags = Array.isArray(staff.tags) ? staff.tags : [];
        for (const tag of tags) {
          const result = scoreTag(tag, studentText);
          if (result.score > best.score) {
            best = {
              staff,
              tag,
              score: result.score,
              hasMeaningfulMatch: result.hasMeaningfulMatch
            };
          }
        }
      }

      return best;
    };

    const getActiveStaffWithTags = async () => User.find({
      role: { $in: STAFF_ROLES },
      isActive: true,
      tags: { $exists: true, $ne: [] },
    }).select("_id name email tags role");

    const analyzeResult = await analyzeConversation(chatHistory, message);

    if (analyzeResult === true) {
      const studentText = normalize(message);
      const staffList = await getActiveStaffWithTags();
      const best = findBestStaffMatch(staffList, studentText);

      const assignmentIntent = ASSIGNMENT_INTENT_REGEX.test(message || "");
      const shouldAutoCreateTicket = assignmentIntent || (best.staff && best.score >= 2 && best.hasMeaningfulMatch);

      if (!shouldAutoCreateTicket) {
        aiResponse = formatStaffSelectionMessage(staffList);
      } else {
        aiResponse = ESCALATION_AUTO_TICKET_RESPONSE;
        chat.escalatedToTicket = true;
        escalated = true;

        const ticket = await Ticket.create({
          userId,
          chatId: chat._id,
          title: `${message.substring(0, TICKET_TITLE_PREVIEW_LENGTH)}...`,
          description: TICKET_DESCRIPTION_TEMPLATE(message, aiResponse),
          category: DEFAULT_TICKET_CATEGORY,
          priority: DEFAULT_TICKET_PRIORITY,
          assignedTo: best.staff._id,
          tag: best.tag || "",
          status: DEFAULT_TICKET_STATUS
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
