import User from '../models/User.js';

/**
 * @typedef {Object} AuthRepository
 * @property {(email: string) => Promise<import('mongoose').Document|null>} findUserByEmail
 * @property {(email: string) => Promise<import('mongoose').Document|null>} findUserByEmailWithPassword
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createUser
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findUserById
 */

export const findUserByEmail = (email) => User.findOne({ email });

export const findUserByEmailWithPassword = (email) =>
  User.findOne({ email }).select('+password');

export const createUser = (data) => User.create(data);

export const findUserById = (id) => User.findById(id);

/** @type {AuthRepository} */
export const authRepository = {
  findUserByEmail,
  findUserByEmailWithPassword,
  createUser,
  findUserById
};
