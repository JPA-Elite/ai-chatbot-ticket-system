import Inquiry from '../models/Inquiry.js';
import { createEmbedding, preprocessText } from '../services/aiService.js';

// @desc    Get all inquiries with pagination & search
// @route   GET /api/inquiry
// @access  Private/Admin
export const getAllInquiry = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = search
      ? {
          $or: [
            { promptQuestion: { $regex: search, $options: 'i' } },
            { promptResponse: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const total = await Inquiry.countDocuments(query);
    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: inquiries.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: inquiries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const preProcessedQuestion = preprocessText(promptQuestion);

    // 1. If question changed → regenerate embedding
    if (preProcessedQuestion && preProcessedQuestion !== preprocessText(inquiry.promptQuestion)) {
      inquiry.promptQuestion = preProcessedQuestion;
      inquiry.embedding = await createEmbedding(preProcessedQuestion);
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
    const preProcessedQuestion = preprocessText(promptQuestion);
    const embedding = await createEmbedding(preProcessedQuestion);

    const newInquiry = new Inquiry({
      promptQuestion: preProcessedQuestion,
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