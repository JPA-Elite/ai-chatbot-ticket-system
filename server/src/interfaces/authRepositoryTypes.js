/**
 * @typedef {Object} AuthRepository
 * @property {(email: string) => Promise<import('mongoose').Document|null>} findUserByEmail
 * @property {(email: string) => Promise<import('mongoose').Document|null>} findUserByEmailWithPassword
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createUser
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findUserById
 */

export {};
