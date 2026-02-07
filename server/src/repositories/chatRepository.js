import Chat from '../models/Chat.js';

/**
 * @typedef {Object} ChatRepository
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findChatById
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createChat
 * @property {(chat: import('mongoose').Document) => Promise<import('mongoose').Document>} saveChat
 * @property {(userId: string) => Promise<import('mongoose').Document[]>} findChatsByUserId
 * @property {(userId: string) => Promise<import('mongoose').DeleteResult>} deleteChatsByUserId
 */

export const findChatById = (id) => Chat.findById(id);

export const createChat = (data) => Chat.create(data);

export const saveChat = (chat) => chat.save();

export const findChatsByUserId = (userId) =>
  Chat.find({ userId }).sort({ updatedAt: -1 });

export const deleteChatsByUserId = (userId) => Chat.deleteMany({ userId });

/** @type {ChatRepository} */
export const chatRepository = {
  findChatById,
  createChat,
  saveChat,
  findChatsByUserId,
  deleteChatsByUserId
};
