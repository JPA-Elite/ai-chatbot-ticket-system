import {
  acceptTicketData,
  addTicketMessageData,
  classifyTicketData,
  endConversationData,
  getAllTicketsData,
  getTicketByIdData,
  getUserTicketsData,
  updateTicketData,
  rejectTicketData,
  forwardTicketData
} from '../services/ticketService.js';
import { SERVER_ERROR_MESSAGE } from '../constants/controllerMessages.js';

// @desc    Get all tickets (admin only)
// @route   GET /api/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await getAllTicketsData({
      page,
      limit,
      status: req.query.status,
      user: req.user
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Get user tickets
// @route   GET /api/tickets/user
// @access  Private
export const getUserTickets = async (req, res) => {
  try {
    const result = await getUserTicketsData(req.user.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const result = await getTicketByIdData({ id: req.params.id, user: req.user });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin
export const updateTicket = async (req, res) => {
  try {
    const result = await updateTicketData({
      id: req.params.id,
      user: req.user,
      updates: req.body
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Add message to ticket
// @route   POST /api/tickets/:id/message
// @access  Private
export const addTicketMessage = async (req, res) => {
  try {
    const result = await addTicketMessageData({
      id: req.params.id,
      user: req.user,
      content: req.body.content
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Classify ticket using AI
// @route   POST /api/tickets/:id/classify
// @access  Private/Admin
export const classifyTicketAI = async (req, res) => {
  try {
    const result = await classifyTicketData({
      id: req.params.id,
      user: req.user
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const acceptTicket = async (req, res) => {
  try {
    const result = await acceptTicketData({
      id: req.params.id,
      user: req.user
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const endConversation = async (req, res) => {
  try {
    const result = await endConversationData({
      id: req.params.id,
      user: req.user
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const rejectTicket = async (req, res) => {
  try {
    const result = await rejectTicketData({
      id: req.params.id,
      user: req.user,
      reason: req.body.reason
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const forwardTicket = async (req, res) => {
  try {
    const result = await forwardTicketData({
      id: req.params.id,
      user: req.user,
      staffId: req.body.staffId
    });
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};
