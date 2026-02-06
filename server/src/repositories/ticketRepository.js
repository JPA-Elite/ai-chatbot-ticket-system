import Ticket from '../models/Ticket.js';

export const findTickets = (filter, { sort, skip, limit }) =>
  Ticket.find(filter).populate('userId', 'name email').populate('assignedTo', 'name email').sort(sort).skip(skip).limit(limit);

export const countTickets = (filter) => Ticket.countDocuments(filter);

export const findTicketsByUserId = (userId) =>
  Ticket.find({ userId })
    .populate('assignedTo', 'name email department')
    .populate('acceptedBy', 'name email')
    .sort({ createdAt: -1 });

export const findTicketById = (id) =>
  Ticket.findById(id)
    .populate('userId', 'name email')
    .populate('assignedTo', 'name email department')
    .populate('acceptedBy', 'name email')
    .populate({
      path: 'messages.sender',
      select: 'name role'
    });

export const findTicketByIdWithChat = (id) =>
  Ticket.findById(id).populate({
    path: 'chatId',
    select: 'messages'
  });

export const findTicketByIdRaw = (id) => Ticket.findById(id);

export const saveTicket = (ticket) => ticket.save();
