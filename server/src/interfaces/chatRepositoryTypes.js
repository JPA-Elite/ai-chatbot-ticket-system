/**
 * @typedef {Object} ChatRepository
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findChatById
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createChat
 * @property {(chat: import('mongoose').Document) => Promise<import('mongoose').Document>} saveChat
 * @property {(userId: string) => Promise<import('mongoose').Document[]>} findChatsByUserId
 * @property {(userId: string) => Promise<import('mongoose').DeleteResult>} deleteChatsByUserId
 */

export {};
