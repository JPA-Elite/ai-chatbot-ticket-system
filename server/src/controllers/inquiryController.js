import Inquiry from '../models/Inquiry.js';
import { createEmbedding } from '../services/aiService.js';

// @desc    Get all inquiry members with statistics
// @route   GET /api/inquiry
// @access  Private/Admin
export const getAllInquiry = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get inquiry member by ID with detailed statistics
// @route   GET /api/inquiry/:id
// @access  Private/Admin
export const getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update inquiry member
// @route   PUT /api/inquiry/:id
// @access  Private/Admin
export const updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry member not found'
      });
    }

    const { promptQuestion, promptResponse, isEnabled } = req.body;

    // 1. If question changed → regenerate embedding
    if (promptQuestion && promptQuestion !== inquiry.promptQuestion) {
      inquiry.promptQuestion = promptQuestion;
      inquiry.embedding = await createEmbedding(promptQuestion);
    }

    // 2. Normal updates
    if (promptResponse) {
      inquiry.promptResponse = promptResponse;
    }

    if (isEnabled !== undefined) {
      inquiry.isEnabled = isEnabled;
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new inquiry member
// @route   POST /api/inquiry
// @access  Private/Admin
export const createInquiry = async (req, res) => {
  try {
    const { promptQuestion, promptResponse, isEnabled } = req.body;
    const embedding = await createEmbedding(promptQuestion);

    const newInquiry = new Inquiry({
      promptQuestion,
      promptResponse,
      embedding,
      isEnabled: isEnabled || false
    });

    await newInquiry.save();

    res.status(201).json({
      success: true,
      data: newInquiry
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete inquiry member
// @route   DELETE /api/inquiry/:id
// @access  Private/Admin
export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry member not found'
      });
    }

    await inquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Inquiry member deleted'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};