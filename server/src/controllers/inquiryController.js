import {
  createInquiryData,
  deleteInquiryData,
  getAllInquiryData,
  getAllInquiryRelevanceData,
  getInquiryByIdData,
  getInquiryRelevanceByIdData,
  importInquiryFileData,
  updateInquiryData,
  updateInquiryRelevanceData
} from '../services/inquiryService.js';
import { SERVER_ERROR_MESSAGE } from '../constants/controllerMessages.js';

// @desc    Get all inquiries with pagination & search
// @route   GET /api/inquiry
// @access  Private/Admin
export const getAllInquiry = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = '', status = 'all' } = req.query;
    const payload = await getAllInquiryData({ page, limit, search, status });
    res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: SERVER_ERROR_MESSAGE });
  }
};

// @desc    Get inquiry member by ID with detailed statistics
// @route   GET /api/inquiry/:id
// @access  Private/Admin
export const getInquiryById = async (req, res) => {
  try {
    const result = await getInquiryByIdData(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Update inquiry member
// @route   PUT /api/inquiry/:id
// @access  Private/Admin
export const updateInquiry = async (req, res) => {
  try {
    const result = await updateInquiryData(req.params.id, req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Create new inquiry member
// @route   POST /api/inquiry
// @access  Private/Admin
export const createInquiry = async (req, res) => {
  try {
    const result = await createInquiryData(req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Delete inquiry member
// @route   DELETE /api/inquiry/:id
// @access  Private/Admin
export const deleteInquiry = async (req, res) => {
  try {
    const result = await deleteInquiryData(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

export const importInquiryFile = async (req, res) => {
  try {
    const count = Number(req.body.count);
    if (!count) {
      return res.status(400).json({
        success: false,
        message: "Count is required"
      });
    }

    const result = await importInquiryFileData(req.file, count);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// ---------------- Inquiry Relevance Controllers ---------------- //

// @desc    Get all inquiry relevance entries with pagination & search
// @route   GET /api/inquiry-relevance
// @access  Private/Admin
export const getAllInquiryRelevance = async (req, res) => {
  try {
    const payload = await getAllInquiryRelevanceData(req.query);
    res.status(200).json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Get inquiry relevance entry by ID
// @route   GET /api/inquiry-relevance/:id
// @access  Private/Admin
export const getInquiryRelevanceById = async (req, res) => {
  try {
    const result = await getInquiryRelevanceByIdData(req.params.id);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};

// @desc    Update inquiry relevance entry
// @route   PUT /api/inquiry-relevance/:id
// @access  Private/Admin
export const updateInquiryRelevance = async (req, res) => {
  try {
    const result = await updateInquiryRelevanceData(req.params.id, req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE
    });
  }
};
