import Inquiry from '../models/Inquiry.js';
import InquiryRelevance from '../models/InquiryRelevance.js';
import { createEmbedding, preprocessText, generateInquiriesAI } from '../services/aiService.js';
import { MAX_CHARS } from '../constants/constants.js';
import textract from 'textract';
import { escapeRegex } from '../utils/utils.js';
import {
  FILE_EXCEEDS_CHAR_LIMIT_MESSAGE,
  FILE_IMPORT_DUPLICATE_MESSAGE,
  FILE_IMPORT_SERVER_ERROR_MESSAGE,
  INQUIRY_MEMBER_DELETED_MESSAGE,
  INQUIRY_MEMBER_NOT_FOUND_MESSAGE,
  INQUIRY_RELEVANCE_NOT_FOUND_MESSAGE,
  IS_RELEVANT_REQUIRED_MESSAGE,
  NO_FILE_UPLOADED_MESSAGE,
  PROMPT_QUESTION_EXISTS_MESSAGE,
  PROMPT_QUESTION_REQUIRED_MESSAGE,
  RELEVANCE_UPDATED_MESSAGE,
  SERVER_ERROR_MESSAGE,
  UNSUPPORTED_FILE_TYPE_MESSAGE
} from '../constants/controllerMessages.js';
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
          { promptQuestion: { $regex: escapeRegex(search), $options: 'i' } },
          { promptResponse: { $regex: escapeRegex(search), $options: 'i' } },
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
    res.status(500).json({ success: false, message: SERVER_ERROR_MESSAGE });
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
        message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE
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
      message: SERVER_ERROR_MESSAGE
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
        message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE,
      });
    }

    const { promptQuestion, promptResponse, isEnabled } = req.body;

    // 🔹 Handle promptQuestion update
    if (promptQuestion) {
      const preProcessedQuestion = preprocessText(promptQuestion);
      const currentQuestion = preprocessText(inquiry.promptQuestion);

      // If question actually changed
      if (preProcessedQuestion !== currentQuestion) {
        // 🔹 Check uniqueness (exclude current record)
        const existing = await Inquiry.findOne({
          promptQuestion: promptQuestion,
          _id: { $ne: inquiry._id },
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: PROMPT_QUESTION_EXISTS_MESSAGE,
          });
        }

        // 🔹 Update question + regenerate embedding
        inquiry.promptQuestion = promptQuestion;
        inquiry.embedding = await createEmbedding(
          preprocessText(preProcessedQuestion, true)
        );
      }
    }

    // 🔹 Normal updates
    if (promptResponse !== undefined) {
      inquiry.promptResponse = promptResponse;
    }

    if (isEnabled !== undefined) {
      inquiry.isEnabled = isEnabled;
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error(error);

    // 🔹 Mongo unique index safeguard
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: PROMPT_QUESTION_EXISTS_MESSAGE,
      });
    }

    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
    });
  }
};

// @desc    Create new inquiry member
// @route   POST /api/inquiry
// @access  Private/Admin
export const createInquiry = async (req, res) => {
  try {
    const { promptQuestion, promptResponse, isEnabled } = req.body;

    if (!promptQuestion) {
      return res.status(400).json({
        success: false,
        message: PROMPT_QUESTION_REQUIRED_MESSAGE,
      });
    }

    // 🔹 Normalize / preprocess
    const preProcessedQuestion = preprocessText(promptQuestion);

    // 🔹 Check uniqueness
    const existing = await Inquiry.findOne({
      promptQuestion: preProcessedQuestion,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: PROMPT_QUESTION_EXISTS_MESSAGE,
      });
    }

    // 🔹 Create embedding
    const embedding = await createEmbedding(
      preprocessText(preProcessedQuestion, true)
    );

    const newInquiry = new Inquiry({
      promptQuestion: preProcessedQuestion,
      promptResponse,
      embedding,
      isEnabled: isEnabled || false
    });

    await newInquiry.save();

    res.status(201).json({
      success: true,
      data: newInquiry,
    });
  } catch (error) {
    console.error(error);

    // 🔹 Handle Mongo unique constraint error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: PROMPT_QUESTION_EXISTS_MESSAGE,
      });
    }

    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
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
        message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE
      });
    }

    await inquiry.deleteOne();

    res.status(200).json({
      success: true,
      message: INQUIRY_MEMBER_DELETED_MESSAGE
    });
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: NO_FILE_UPLOADED_MESSAGE,
      });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = ['csv', 'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: UNSUPPORTED_FILE_TYPE_MESSAGE,
      });
    }

    let text = '';

    if (ext === 'txt') {
      text = req.file.buffer.toString('utf-8');
    } else {
      // Use textract for pdf/doc/docx/xls/xlsx
      text = await new Promise((resolve, reject) => {
        textract.fromBufferWithName(req.file.originalname, req.file.buffer, (err, result) => {
          if (err) return reject(err);
          resolve(result || '');
        });
      });
    }

    // Enforce character limit
    if (text.length > MAX_CHARS) {
      return res.status(400).json({
        success: false,
        message: FILE_EXCEEDS_CHAR_LIMIT_MESSAGE(MAX_CHARS),
      });
    }

    // Generate AI-based inquiries
    const count = req.body.count ? parseInt(req.body.count, 10) : 5; // default 5 inquiries
    const inquiries = await generateInquiriesAI(text, count);

    // store inquiries in DB
    for (const item of inquiries) {
      const preProcessedQuestion = preprocessText(item.question);
      const embedding = await createEmbedding(preprocessText(preProcessedQuestion, true));

      const newInquiry = new Inquiry({
        promptQuestion: preProcessedQuestion,
        promptResponse: item.answer.trim(),
        embedding,
        isEnabled: true,
      });

      await newInquiry.save();
    }

    return res.status(200).json({
      success: true,
      text,
      length: text.length,
      type: ext,
      inquiries,
    });
  } catch (error) {
    let message = FILE_IMPORT_SERVER_ERROR_MESSAGE;
    if (error.message.includes('E11000')) {
      message = FILE_IMPORT_DUPLICATE_MESSAGE;
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: message,
    });
  }
};

// ---------------- Inquiry Relevance Controllers ---------------- //

// @desc    Get all inquiry relevance entries with pagination & search
// @route   GET /api/inquiry-relevance
// @access  Private/Admin
export const getAllInquiryRelevance = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 5,
      search = '',
      relevance = 'all',
      updated = 'all',
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    /* -----------------------------
    Build match conditions
    ----------------------------- */
    const matchStage = {};
    const andConditions = [];

    // 🔍 Search filter
    if (search) {
      andConditions.push({
        $or: [
          { userInquiry: { $regex: escapeRegex(search), $options: 'i' } },
          { generatedInquiry: { $regex: escapeRegex(search), $options: 'i' } },
        ],
      });
    }

    // ✅ Relevance filter
    if (relevance === 'relevant') {
      matchStage.isRelevant = 1;
    } else if (relevance === 'not_relevant') {
      matchStage.isRelevant = 0;
    }

    // ✅ Updated filter
    if (updated === 'updated') {
      matchStage.isUpdated = true;
    } else if (updated === 'not_updated') {
      andConditions.push({
        $or: [
          { isUpdated: false },
          { isUpdated: { $exists: false } },
        ],
      });
    }

    if (andConditions.length > 0) {
      matchStage.$and = andConditions;
    }

    /* -----------------------------
    Build main aggregation pipeline
    ----------------------------- */
    const pipeline = [
      { $match: matchStage },

      // 🔹 Group by unique inquiry pair
      {
        $group: {
          _id: {
            userInquiry: '$userInquiry',
            generatedInquiry: '$generatedInquiry',
          },
          doc: { $first: '$$ROOT' }, // keep latest
        },
      },

      // 🔹 Flatten
      { $replaceRoot: { newRoot: '$doc' } },

      // 🔹 Sort newest first
      { $sort: { createdAt: -1 } },

      // 🔹 Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const entries = await InquiryRelevance.aggregate(pipeline);

    /* -----------------------------
    Count total unique pairs
    ----------------------------- */
    const totalAgg = await InquiryRelevance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            userInquiry: '$userInquiry',
            generatedInquiry: '$generatedInquiry',
          },
        },
      },
      { $count: 'total' },
    ]);

    const total = totalAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: entries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
    });
  }
}

// @desc    Get inquiry relevance entry by ID
// @route   GET /api/inquiry-relevance/:id
// @access  Private/Admin
export const getInquiryRelevanceById = async (req, res) => {
  try {
    const entry = await InquiryRelevance.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: INQUIRY_RELEVANCE_NOT_FOUND_MESSAGE
      });
    }

    res.status(200).json({
      success: true,
      data: entry
    });
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
    const entry = await InquiryRelevance.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: INQUIRY_RELEVANCE_NOT_FOUND_MESSAGE,
      });
    }

    const { isRelevant, isUpdated } = req.body;

    if (isRelevant === undefined) {
      return res.status(400).json({
        success: false,
        message: IS_RELEVANT_REQUIRED_MESSAGE,
      });
    }

    // 🔹 Update ALL records with same inquiry pair
    const result = await InquiryRelevance.updateMany(
      {
        userInquiry: entry.userInquiry,
        generatedInquiry: entry.generatedInquiry,
      },
      {
        $set: {
          isRelevant,
          ...(typeof isUpdated === 'boolean' ? { isUpdated } : {}),
        },
      }
    );

    res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
      message: RELEVANCE_UPDATED_MESSAGE,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: SERVER_ERROR_MESSAGE,
    });
  }
};
