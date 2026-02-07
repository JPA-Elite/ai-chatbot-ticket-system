import User from '../models/User.js';

/** @typedef {import('../interfaces/authRepositoryTypes.js').AuthRepository} AuthRepository */

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
