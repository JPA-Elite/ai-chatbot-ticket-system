import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import InquiryRelevance from '../models/InquiryRelevance.js';
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
  STAFF_NUMBER_SELECTION_REGEX,
  STAFF_ROLES,
  STAFF_CONCERN_PREVIEW_LIMIT,
  STAFF_SELECTION_EXAMPLE_REPLY,
  STAFF_SELECTION_FALLBACK_MESSAGE,
  STAFF_SELECTION_INTRO_LINES,
  STAFF_SELECTION_MAX_RESULTS,
  STAFF_TAG_DEFAULT,
  TAG_MATCH_STOP_WORDS,
  RESPOND_TO_ESCALATION_MSG,
  TICKET_DESCRIPTION_TEMPLATE,
  TICKET_TITLE_PREVIEW_LENGTH
} from '../constants/constants.js';
import {
  ALL_CHATS_DELETED_MESSAGE,
  CHAT_MULTIPLE_STAFF_MATCHED_MESSAGE,
  CHAT_NOT_AUTHORIZED_MESSAGE,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_PROCESSING_ERROR_MESSAGE,
  CHAT_SELECT_NUMBER_MESSAGE,
  SUPPORT_REQUEST_TITLE
} from '../constants/controllerMessages.js';
import { analyzeConversation } from '../services/aiService.js';
import { sendTicketCreatedToStaff } from '../services/emailService.js';
import { buildUpdatedInquiryMatchMessages } from '../services/openaiPrompts.js';
import { computeTokenOverlap, createChatCompletion, normalizeInquiryText } from '../utils/utils.js';
import {
  createChat,
  deleteChatsByUserId,
  findChatById,
  findChatsByUserId,
  saveChat
} from '../repositories/chatRepository.js';

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

const findUpdatedInquiryOverride = async (message = "") => {
  const updatedEntries = await InquiryRelevance.find({ isUpdated: true })
    .select('userInquiry generatedInquiry generatedResponse isRelevant createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!updatedEntries.length) {
    return null;
  }

  const normalizedMessage = normalizeInquiryText(message);
  if (normalizedMessage) {
    const exactMatch = updatedEntries.find(entry => (
      normalizeInquiryText(entry.userInquiry) === normalizedMessage
    ));

    if (exactMatch) {
      return exactMatch;
    }
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of updatedEntries) {
    const score = computeTokenOverlap(entry.userInquiry, message);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore >= 0.6) {
    return bestMatch;
  }

  const formattedEntries = updatedEntries
    .map((entry, index) => ([
      `${index + 1}.`,
      `userInquiry: ${entry.userInquiry}`,
      `generatedInquiry: ${entry.generatedInquiry}`,
      `generatedResponse: ${entry.generatedResponse}`,
      `isRelevant: ${entry.isRelevant}`
    ].join('\n')))
    .join('\n\n');

  const response = await createChatCompletion({
    model: process.env.CHATGPT_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: buildUpdatedInquiryMatchMessages(message, formattedEntries)
  });

  const content = response.choices?.[0]?.message?.content || '';
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse updated inquiry match response:', error);
    return null;
  }

  if (!parsed?.isMatch || typeof parsed.matchIndex !== 'number') {
    return null;
  }

  const matchIndex = parsed.matchIndex - 1;
  if (matchIndex < 0 || matchIndex >= updatedEntries.length) {
    return null;
  }

  return updatedEntries[matchIndex];
};

export const sendMessageData = async ({ message, chatId, user }) => {
  let chat;
  if (chatId) {
    chat = await findChatById(chatId);

    if (!chat) {
      return { status: 404, payload: { success: false, message: CHAT_NOT_FOUND_MESSAGE } };
    }

    if (chat.userId.toString() !== user.id) {
      return { status: 403, payload: { success: false, message: CHAT_NOT_AUTHORIZED_MESSAGE } };
    }
  } else {
    chat = await createChat({
      userId: user.id,
      messages: [
        {
          role: 'system',
          content: CHAT_SYSTEM_MESSAGE
        }
      ]
    });
  }

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

  const getActiveStaffWithTags = async () =>
    User.find({
      role: { $in: STAFF_ROLES },
      isActive: true
    })
      .select("_id name email tags role")
      .sort({ name: 1, _id: 1 });

  const selectionMatch = STAFF_NUMBER_SELECTION_REGEX.exec(String(message || ""));

  const lastAssistantIndex = (() => {
    for (let i = chat.messages.length - 1; i >= 0; i -= 1) {
      if (chat.messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  const lastAssistantText =
    lastAssistantIndex >= 0 ? String(chat.messages[lastAssistantIndex]?.content || "") : "";

  const isStaffListContext =
    lastAssistantText.includes(STAFF_SELECTION_EXAMPLE_REPLY) ||
    STAFF_SELECTION_INTRO_LINES.some(line => lastAssistantText.includes(line));

  const extractLastTicketIntentMessage = () => {
    if (lastAssistantIndex > 0) {
      for (let i = lastAssistantIndex - 1; i >= 0; i -= 1) {
        if (chat.messages[i]?.role === "user") {
          return String(chat.messages[i]?.content || "");
        }
      }
    }
    return "";
  };

  const normalizeLoose = (s = "") =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s@.\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const selectStaffByText = (staffList = [], userText = "") => {
    const input = normalizeLoose(userText);
    if (!input) return { staff: null, ambiguous: false };

    const emailLike = input.includes("@") ? input : "";
    const candidates = staffList.slice(0, STAFF_SELECTION_MAX_RESULTS);

    const emailMatches = emailLike
      ? candidates.filter(s => normalizeLoose(s.email || "") === emailLike)
      : [];

    if (emailMatches.length === 1) return { staff: emailMatches[0], ambiguous: false };
    if (emailMatches.length > 1) return { staff: null, ambiguous: true };

    const tokens = input.split(" ").filter(Boolean);
    const stop = new Set(["staff", "admin", "please", "assign", "route", "forward", "endorse", "to", "for", "this", "ticket"]);
    const keyTokens = tokens.filter(t => t.length >= 3 && !stop.has(t));

    if (!keyTokens.length) return { staff: null, ambiguous: false };

    const scored = candidates
      .map(s => {
        const name = normalizeLoose(s.name || "");
        if (!name) return { staff: s, score: 0 };
        let score = 0;

        for (const t of keyTokens) {
          if (name.includes(t)) score += 1;
        }

        if (input === name) score += 5;
        if (input.length >= 4 && name.includes(input)) score += 3;

        return { staff: s, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return { staff: null, ambiguous: false };

    const top = scored[0];
    const second = scored[1];

    if (second && top.score === second.score) return { staff: null, ambiguous: true };

    if (top.score >= 2) return { staff: top.staff, ambiguous: false };

    return { staff: null, ambiguous: false };
  };

  const createTicketForSelectedStaff = async (selectedStaff, triggerUserMessage) => {
    const triggerText = normalize(triggerUserMessage);
    const staffTags = Array.isArray(selectedStaff.tags) ? selectedStaff.tags : [];

    let chosenTag = STAFF_TAG_DEFAULT;
    let bestTagScore = 0;

    for (const tag of staffTags) {
      const r = scoreTag(tag, triggerText);
      if (r.score > bestTagScore) {
        bestTagScore = r.score;
        chosenTag = String(tag || "").trim() || STAFF_TAG_DEFAULT;
      }
    }

    if (chosenTag === STAFF_TAG_DEFAULT && staffTags.length) {
      chosenTag = String(staffTags[0] || "").trim() || STAFF_TAG_DEFAULT;
    }

    aiResponse = ESCALATION_AUTO_TICKET_RESPONSE;
    chat.escalatedToTicket = true;
    escalated = true;

    const titleBase = triggerUserMessage || SUPPORT_REQUEST_TITLE;
    const safeTitle =
      titleBase.length > TICKET_TITLE_PREVIEW_LENGTH
        ? `${titleBase.substring(0, TICKET_TITLE_PREVIEW_LENGTH)}...`
        : titleBase;

    const ticket = await Ticket.create({
      userId: user.id,
      chatId: chat._id,
      title: safeTitle,
      description: TICKET_DESCRIPTION_TEMPLATE(triggerUserMessage || message, aiResponse),
      category: DEFAULT_TICKET_CATEGORY,
      priority: DEFAULT_TICKET_PRIORITY,
      assignedTo: selectedStaff._id,
      tag: chosenTag || "",
      status: DEFAULT_TICKET_STATUS
    });

    chat.ticketId = ticket._id;
    ticketId = ticket._id;

    try {
      const student = await User.findById(user.id).select("name email");

      const matchedStaffEmail =
        ticket.assignedTo
          ? (await User.findById(ticket.assignedTo).select("email"))?.email
          : null;

      if (student) {
        if (matchedStaffEmail) {
          await sendTicketCreatedToStaff(ticket, student.name, student.email, [matchedStaffEmail]);
        } else {
          await sendTicketCreatedToStaff(ticket, student.name, student.email);
        }
      }
    } catch (emailError) {
      console.error("Error sending ticket notification email:", emailError);
    }
  };

  if (isStaffListContext) {
    const staffList = await getActiveStaffWithTags();
    const max = Math.min(staffList.length, STAFF_SELECTION_MAX_RESULTS);

    if (selectionMatch) {
      const choice = parseInt(selectionMatch[1], 10);

      if (!Number.isFinite(choice) || choice < 1 || choice > max) {
        aiResponse = CHAT_SELECT_NUMBER_MESSAGE(max);
      } else {
        const selectedStaff = staffList[choice - 1];
        const triggerUserMessage = extractLastTicketIntentMessage();
        await createTicketForSelectedStaff(selectedStaff, triggerUserMessage);
      }

      chat.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now()
      });

      await saveChat(chat);

      return {
        status: 200,
        payload: { success: true, data: { chat, escalated, ticketId } }
      };
    }

    const byText = selectStaffByText(staffList, message);

    if (byText.ambiguous) {
      aiResponse = CHAT_MULTIPLE_STAFF_MATCHED_MESSAGE(max);

      chat.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now()
      });

      await saveChat(chat);

      return {
        status: 200,
        payload: { success: true, data: { chat, escalated, ticketId } }
      };
    }

    if (byText.staff) {
      const triggerUserMessage = extractLastTicketIntentMessage();
      await createTicketForSelectedStaff(byText.staff, triggerUserMessage);

      chat.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now()
      });

      await saveChat(chat);

      return {
        status: 200,
        payload: { success: true, data: { chat, escalated, ticketId } }
      };
    }
  }

  const updatedInquiryMatch = await findUpdatedInquiryOverride(message);

  if (updatedInquiryMatch) {
    if (updatedInquiryMatch.isRelevant === 0) {
      aiResponse = RESPOND_TO_ESCALATION_MSG;
    } else {
      aiResponse = updatedInquiryMatch.generatedResponse;
    }
  } else {
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
          userId: user.id,
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
          const student = await User.findById(user.id).select('name email');

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
  }

  chat.messages.push({
    role: 'assistant',
    content: aiResponse,
    timestamp: Date.now()
  });

  await saveChat(chat);

  return {
    status: 200,
    payload: {
      success: true,
      data: {
        chat,
        escalated,
        ticketId
      }
    }
  };
};

export const getChatByIdData = async ({ chatId, user }) => {
  const chat = await findChatById(chatId);
  if (!chat) {
    return { status: 404, payload: { success: false, message: CHAT_NOT_FOUND_MESSAGE } };
  }

  if (chat.userId.toString() !== user.id && user.role !== 'admin') {
    return { status: 403, payload: { success: false, message: CHAT_NOT_AUTHORIZED_MESSAGE } };
  }

  return { status: 200, payload: { success: true, data: chat } };
};

export const getUserChatsData = async (userId) => {
  const chats = await findChatsByUserId(userId);
  return { status: 200, payload: { success: true, count: chats.length, data: chats } };
};

export const deleteAllChatsData = async (userId) => {
  const result = await deleteChatsByUserId(userId);
  return {
    status: 200,
    payload: {
      success: true,
      message: ALL_CHATS_DELETED_MESSAGE,
      deletedCount: result.deletedCount
    }
  };
};
