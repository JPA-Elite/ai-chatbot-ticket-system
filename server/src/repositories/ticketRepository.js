import Ticket from '../models/Ticket.js';

/**
 * @typedef {Object} TicketRepository
 * @property {(filter: Record<string, unknown>, options: { sort: Record<string, unknown>, skip: number, limit: number }) => Promise<import('mongoose').Document[]>} findTickets
 * @property {(filter: Record<string, unknown>) => Promise<number>} countTickets
 * @property {(userId: string) => Promise<import('mongoose').Document[]>} findTicketsByUserId
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketById
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketByIdWithChat
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findTicketByIdRaw
 * @property {(ticket: import('mongoose').Document) => Promise<import('mongoose').Document>} saveTicket
 */

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

/** @type {TicketRepository} */
export const ticketRepository = {
  findTickets,
  countTickets,
  findTicketsByUserId,
  findTicketById,
  findTicketByIdWithChat,
  findTicketByIdRaw,
  saveTicket
};
