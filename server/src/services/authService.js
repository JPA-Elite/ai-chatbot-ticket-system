import {
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
