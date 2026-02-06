import { classifyTicket } from '../services/aiService.js';
import { sendTicketAcceptedToStudent } from '../services/emailService.js';
import {
  MESSAGE_CONTENT_REQUIRED_MESSAGE,
  TICKET_ACCEPT_NOT_AUTHORIZED_MESSAGE,
  TICKET_ACCESS_NOT_AUTHORIZED_MESSAGE,
  TICKET_ALREADY_ACCEPTED_MESSAGE,
  TICKET_CLASSIFY_NOT_AUTHORIZED_MESSAGE,
  TICKET_END_CONVERSATION_NOT_AUTHORIZED_MESSAGE,
  TICKET_NOT_FOUND_MESSAGE,
  TICKET_UPDATE_NOT_AUTHORIZED_MESSAGE,
  TICKET_ADD_MESSAGE_NOT_AUTHORIZED_MESSAGE
} from '../constants/controllerMessages.js';
import {
  countTickets,
  findTicketById,
  findTicketByIdRaw,
  findTicketByIdWithChat,
  findTickets,
  findTicketsByUserId,
  saveTicket
} from '../repositories/ticketRepository.js';

export const getAllTicketsData = async ({ page = 1, limit = 10, status, user }) => {
  const startIndex = (page - 1) * limit;
  let filter = {};

  if (status) {
    filter.status = status;
  }

  if (user.role === 'staff') {
    const User = (await import('../models/User.js')).default;
    const me = await User.findById(user.id).select('tags');
    const myTags = (me?.tags || []).map(t => String(t).trim()).filter(Boolean);
    const tagFilter = myTags.length ? { $in: myTags } : { $in: [] };

    filter = {
      ...filter,
      $or: [
        { assignedTo: user.id },
        { assignedTo: null, tag: tagFilter }
      ]
    };
  }

  const tickets = await findTickets(filter, {
    sort: { createdAt: -1 },
    skip: startIndex,
    limit
  });
  const total = await countTickets(filter);

  return {
    status: 200,
    payload: {
      success: true,
      count: tickets.length,
      total,
      pagination: {
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      data: tickets
    }
  };
};

export const getUserTicketsData = async (userId) => {
  const tickets = await findTicketsByUserId(userId);
  return {
    status: 200,
    payload: { success: true, count: tickets.length, data: tickets }
  };
};

export const getTicketByIdData = async ({ id, user }) => {
  const ticket = await findTicketById(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  const isOwner = ticket.userId._id.toString() === user.id;
  const isStaff = user.role === 'admin' || user.role === 'staff';
  const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === user.id;

  if (!isOwner && !isStaff && !isAssigned) {
    return {
      status: 403,
      payload: { success: false, message: TICKET_ACCESS_NOT_AUTHORIZED_MESSAGE }
    };
  }

  return { status: 200, payload: { success: true, data: ticket } };
};

export const updateTicketData = async ({ id, user, updates }) => {
  let ticket = await findTicketByIdRaw(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  if (user.role !== 'admin') {
    return {
      status: 403,
      payload: { success: false, message: TICKET_UPDATE_NOT_AUTHORIZED_MESSAGE }
    };
  }

  const { status, priority, category, assignedTo } = updates;
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (category) ticket.category = category;
  if (assignedTo) ticket.assignedTo = assignedTo;

  await saveTicket(ticket);
  ticket = await findTicketById(id);

  return { status: 200, payload: { success: true, data: ticket } };
};

export const addTicketMessageData = async ({ id, user, content }) => {
  if (!content) {
    return {
      status: 400,
      payload: { success: false, message: MESSAGE_CONTENT_REQUIRED_MESSAGE }
    };
  }

  const ticket = await findTicketByIdRaw(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  const isOwner = ticket.userId.toString() === user.id;
  const isStaff = user.role === 'admin' || user.role === 'staff';
  const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === user.id;

  if (!isOwner && !isStaff && !isAssigned) {
    return {
      status: 403,
      payload: { success: false, message: TICKET_ADD_MESSAGE_NOT_AUTHORIZED_MESSAGE }
    };
  }

  ticket.messages.push({ sender: user.id, content });

  if ((user.role === 'admin' || user.role === 'staff') && ticket.status === 'accepted') {
    ticket.status = 'in-progress';
  }

  await saveTicket(ticket);
  const updatedTicket = await findTicketById(id);

  return { status: 200, payload: { success: true, data: updatedTicket } };
};

export const classifyTicketData = async ({ id, user }) => {
  const ticket = await findTicketByIdWithChat(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  if (user.role !== 'admin') {
    return {
      status: 403,
      payload: { success: false, message: TICKET_CLASSIFY_NOT_AUTHORIZED_MESSAGE }
    };
  }

  const chatMessages = ticket.chatId ? ticket.chatId.messages : [];
  const { category, priority } = await classifyTicket(ticket.description, chatMessages);
  ticket.category = category;
  ticket.priority = priority;
  await saveTicket(ticket);

  return {
    status: 200,
    payload: { success: true, data: { ticketId: ticket._id, category, priority } }
  };
};

export const acceptTicketData = async ({ id, user }) => {
  const ticket = await findTicketByIdRaw(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  if (ticket.status !== 'pending') {
    return {
      status: 400,
      payload: { success: false, message: TICKET_ALREADY_ACCEPTED_MESSAGE }
    };
  }

  if (user.role === 'staff') {
    const User = (await import('../models/User.js')).default;
    const me = await User.findById(user.id).select('tags');
    const myTags = (me?.tags || []).map(t => String(t).trim());

    const ticketTag = String(ticket.tag || '').trim();
    const allowed = ticketTag && myTags.includes(ticketTag);

    if (!allowed) {
      return {
        status: 403,
        payload: { success: false, message: TICKET_ACCEPT_NOT_AUTHORIZED_MESSAGE }
      };
    }
  }

  ticket.status = 'accepted';
  ticket.acceptedBy = user.id;
  ticket.acceptedAt = new Date();
  ticket.assignedTo = user.id;
  await saveTicket(ticket);

  const updatedTicket = await findTicketById(id);

  try {
    const studentName = updatedTicket.userId?.name || 'Student';
    const studentEmail = updatedTicket.userId?.email || '';
    const staffName = updatedTicket.acceptedBy?.name || 'Staff';
    if (studentEmail) {
      await sendTicketAcceptedToStudent(updatedTicket, studentName, studentEmail, staffName);
    }
  } catch (emailError) {
    console.error('Error sending acceptance email:', emailError);
  }

  return { status: 200, payload: { success: true, data: updatedTicket } };
};

export const endConversationData = async ({ id, user }) => {
  const ticket = await findTicketByIdRaw(id);
  if (!ticket) {
    return { status: 404, payload: { success: false, message: TICKET_NOT_FOUND_MESSAGE } };
  }

  if (user.role !== 'admin' && user.role !== 'staff') {
    return {
      status: 403,
      payload: { success: false, message: TICKET_END_CONVERSATION_NOT_AUTHORIZED_MESSAGE }
    };
  }

  ticket.status = 'resolved';
  await saveTicket(ticket);
  const updatedTicket = await findTicketById(id);

  return { status: 200, payload: { success: true, data: updatedTicket } };
};
