import User from '../models/User.js';

export const findUserByEmail = (email) => User.findOne({ email });

export const findUserByEmailWithPassword = (email) =>
  User.findOne({ email }).select('+password');

export const createUser = (data) => User.create(data);

export const findUserById = (id) => User.findById(id);
