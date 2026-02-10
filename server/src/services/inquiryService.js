import textract from 'textract';
import { createEmbedding, preprocessText, generateInquiriesAI } from '../services/aiService.js';
import { MAX_CHARS } from '../constants/constants.js';
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
  UNSUPPORTED_FILE_TYPE_MESSAGE
} from '../constants/controllerMessages.js';
import {
  aggregateInquiryRelevance,
  countInquiries,
  createInquiry,
  deleteInquiryById,
  findInquiries,
  findInquiryById,
  findInquiryByPromptQuestion,
  findInquiryByPromptQuestionExcludingId,
  findInquiryRelevanceById,
  saveInquiry,
  updateInquiryRelevanceMany
} from '../repositories/inquiryRepository.js';

export const getAllInquiryData = async ({ page = 1, limit = 5, search = '', status = 'all' }) => {
  const query = {};

  if (search) {
    query.$or = [
      { promptQuestion: { $regex: escapeRegex(search), $options: 'i' } },
      { promptResponse: { $regex: escapeRegex(search), $options: 'i' } }
    ];
  }

  if (status !== 'all') {
    query.isEnabled = status === 'enabled';
  }

  const total = await countInquiries(query);
  const inquiries = await findInquiries(query, {
    sort: { createdAt: -1 },
    skip: (page - 1) * limit,
    limit
  });

  return {
    success: true,
    count: inquiries.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: inquiries
  };
};

export const getInquiryByIdData = async (id) => {
  const inquiry = await findInquiryById(id);
  if (!inquiry) {
    return {
      status: 404,
      payload: { success: false, message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  return {
    status: 200,
    payload: { success: true, data: inquiry }
  };
};

export const updateInquiryData = async (id, { promptQuestion, promptResponse, isEnabled }) => {
  const inquiry = await findInquiryById(id);
  if (!inquiry) {
    return {
      status: 404,
      payload: { success: false, message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  if (promptQuestion) {
    const preProcessedQuestion = preprocessText(promptQuestion);
    const currentQuestion = preprocessText(inquiry.promptQuestion);

    if (preProcessedQuestion !== currentQuestion) {
      const existing = await findInquiryByPromptQuestionExcludingId(promptQuestion, inquiry._id);
      if (existing) {
        return {
          status: 409,
          payload: { success: false, message: PROMPT_QUESTION_EXISTS_MESSAGE }
        };
      }

      inquiry.promptQuestion = promptQuestion;
      inquiry.embedding = await createEmbedding(preprocessText(preProcessedQuestion, true));
    }
  }

  if (promptResponse !== undefined) {
    inquiry.promptResponse = promptResponse;
  }
  if (isEnabled !== undefined) {
    inquiry.isEnabled = isEnabled;
  }

  const updated = await saveInquiry(inquiry);
  return { status: 200, payload: { success: true, data: updated } };
};

export const createInquiryData = async ({ promptQuestion, promptResponse }) => {
  if (!promptQuestion) {
    return {
      status: 400,
      payload: { success: false, message: PROMPT_QUESTION_REQUIRED_MESSAGE }
    };
  }

  const existing = await findInquiryByPromptQuestion(promptQuestion);
  if (existing) {
    return {
      status: 409,
      payload: { success: false, message: PROMPT_QUESTION_EXISTS_MESSAGE }
    };
  }

  const embedding = await createEmbedding(preprocessText(promptQuestion, true));
  const inquiry = await createInquiry({
    promptQuestion,
    promptResponse,
    embedding
  });

  return { status: 201, payload: { success: true, data: inquiry } };
};

export const deleteInquiryData = async (id) => {
  const inquiry = await findInquiryById(id);
  if (!inquiry) {
    return {
      status: 404,
      payload: { success: false, message: INQUIRY_MEMBER_NOT_FOUND_MESSAGE }
    };
  }

  await deleteInquiryById(id);
  return {
    status: 200,
    payload: { success: true, message: INQUIRY_MEMBER_DELETED_MESSAGE }
  };
};

export const importInquiryFileData = async (file, count) => {
  if (!file) {
    return { status: 400, payload: { success: false, message: NO_FILE_UPLOADED_MESSAGE } };
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return { status: 400, payload: { success: false, message: UNSUPPORTED_FILE_TYPE_MESSAGE } };
  }

  const text = await new Promise((resolve, reject) => {
    textract.fromBufferWithMime(file.mimetype, file.buffer, (error, extracted) => {
      if (error) return reject(error);
      resolve(extracted || '');
    });
  });

  const normalizedText = String(text || '').trim();
  if (normalizedText.length > MAX_CHARS) {
    return {
      status: 400,
      payload: { success: false, message: FILE_EXCEEDS_CHAR_LIMIT_MESSAGE(MAX_CHARS) }
    };
  }

  try {
    const inquiries = await generateInquiriesAI(normalizedText, count);

    for (const inquiry of inquiries) {
      const existing = await findInquiryByPromptQuestion(inquiry.question);
      if (existing) {
        continue;
      }
      const embedding = await createEmbedding(preprocessText(inquiry.question, true));
      await createInquiry({
        promptQuestion: inquiry.question,
        promptResponse: inquiry.answer,
        embedding
      });
    }

    return {
      status: 200,
      payload: {
        success: true,
        text: normalizedText,
        length: normalizedText.length,
        type: file.mimetype,
        inquiries
      }
    };
  } catch (error) {
    let message = FILE_IMPORT_SERVER_ERROR_MESSAGE;
    if (error.message.includes('E11000')) {
      message = FILE_IMPORT_DUPLICATE_MESSAGE;
    }

    return { status: 500, payload: { success: false, message } };
  }
};

export const getAllInquiryRelevanceData = async ({ page = 1, limit = 5, search = '', relevance = 'all', updated = 'all' }) => {
  page = parseInt(page);
  limit = parseInt(limit);

  const matchStage = {};
  const andConditions = [];

  if (search) {
    andConditions.push({
      $or: [
        { userInquiry: { $regex: escapeRegex(search), $options: 'i' } },
        { generatedInquiry: { $regex: escapeRegex(search), $options: 'i' } }
      ]
    });
  }

  if (relevance === 'relevant') {
    matchStage.isRelevant = 1;
  } else if (relevance === 'not_relevant') {
    matchStage.isRelevant = 0;
  }

  if (updated === 'updated') {
    matchStage.isUpdated = true;
  } else if (updated === 'not_updated') {
    andConditions.push({
      $or: [
        { isUpdated: false },
        { isUpdated: { $exists: false } }
      ]
    });
  }

  if (andConditions.length > 0) {
    matchStage.$and = andConditions;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          userInquiry: '$userInquiry',
          generatedInquiry: '$generatedInquiry'
        },
        doc: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  ];

  const entries = await aggregateInquiryRelevance(pipeline);

  const totalAgg = await aggregateInquiryRelevance([
    { $match: matchStage },
    {
      $group: {
        _id: {
          userInquiry: '$userInquiry',
          generatedInquiry: '$generatedInquiry'
        }
      }
    },
    { $count: 'total' }
  ]);

  const total = totalAgg[0]?.total || 0;

  return {
    success: true,
    count: entries.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: entries
  };
};

export const getInquiryRelevanceByIdData = async (id) => {
  const entry = await findInquiryRelevanceById(id);
  if (!entry) {
    return {
      status: 404,
      payload: { success: false, message: INQUIRY_RELEVANCE_NOT_FOUND_MESSAGE }
    };
  }

  return { status: 200, payload: { success: true, data: entry } };
};

export const updateInquiryRelevanceData = async (id, { isRelevant, isUpdated }) => {
  const entry = await findInquiryRelevanceById(id);
  if (!entry) {
    return {
      status: 404,
      payload: { success: false, message: INQUIRY_RELEVANCE_NOT_FOUND_MESSAGE }
    };
  }

  if (isRelevant === undefined) {
    return {
      status: 400,
      payload: { success: false, message: IS_RELEVANT_REQUIRED_MESSAGE }
    };
  }

  const result = await updateInquiryRelevanceMany(
    {
      userInquiry: entry.userInquiry,
      generatedInquiry: entry.generatedInquiry
    },
    {
      $set: {
        isRelevant,
        ...(typeof isUpdated === 'boolean' ? { isUpdated } : {})
      }
    }
  );

  return {
    status: 200,
    payload: {
      success: true,
      updatedCount: result.modifiedCount,
      message: RELEVANCE_UPDATED_MESSAGE
    }
  };
};
