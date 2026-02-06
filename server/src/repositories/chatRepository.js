import Chat from '../models/Chat.js';

export const findChatById = (id) => Chat.findById(id);

export const createChat = (data) => Chat.create(data);

export const saveChat = (chat) => chat.save();

export const findChatsByUserId = (userId) =>
  Chat.find({ userId }).sort({ updatedAt: -1 });

export const deleteChatsByUserId = (userId) => Chat.deleteMany({ userId });
