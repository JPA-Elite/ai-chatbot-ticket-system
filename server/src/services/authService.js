import {
  EMAIL_ALREADY_IN_USE_MESSAGE,
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  PROVIDE_EMAIL_PASSWORD_MESSAGE
} from '../constants/controllerMessages.js';
import {
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById
} from '../repositories/authRepository.js';

export const registerUser = async ({ name, email, password }) => {
  const userExists = await findUserByEmail(email);
  if (userExists) {
    return { status: 400, payload: { success: false, message: EMAIL_ALREADY_REGISTERED_MESSAGE } };
  }

  const user = await createUser({ name, email, password });
  const token = user.getSignedJwtToken();

  return {
    status: 201,
    payload: {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    return { status: 400, payload: { success: false, message: PROVIDE_EMAIL_PASSWORD_MESSAGE } };
  }

  const user = await findUserByEmailWithPassword(email);
  if (!user) {
    return { status: 401, payload: { success: false, message: INVALID_CREDENTIALS_MESSAGE } };
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return { status: 401, payload: { success: false, message: INVALID_CREDENTIALS_MESSAGE } };
  }

  const token = user.getSignedJwtToken();

  return {
    status: 200,
    payload: {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  return {
    status: 200,
    payload: {
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};

export const updateUserProfile = async (userId, { name, email, password }) => {
  const trimmedName = name?.trim() ?? '';
  const normalizedEmail = email?.trim().toLowerCase() ?? '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedName || trimmedName.length < 2) {
    return { status: 400, payload: { success: false, message: 'Name must be at least 2 characters' } };
  }

  if (trimmedName.length > 50) {
    return { status: 400, payload: { success: false, message: 'Name cannot be more than 50 characters' } };
  }

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return { status: 400, payload: { success: false, message: 'Please add a valid email' } };
  }

  if (password && password.length < 6) {
    return { status: 400, payload: { success: false, message: 'Password must be at least 6 characters' } };
  }

  const user = await findUserById(userId);
  if (!user) {
    return { status: 404, payload: { success: false, message: 'User not found' } };
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser && existingUser._id.toString() !== userId) {
    return { status: 400, payload: { success: false, message: EMAIL_ALREADY_IN_USE_MESSAGE } };
  }

  user.name = trimmedName;
  user.email = normalizedEmail;
  if (password) {
    user.password = password;
  }
  await user.save();

  return {
    status: 200,
    payload: {
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};
