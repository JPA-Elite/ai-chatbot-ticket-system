import Inquiry from '../models/Inquiry.js';
import InquiryRelevance from '../models/InquiryRelevance.js';

/**
 * @typedef {Object} InquiryRepository
 * @property {(query: Record<string, unknown>) => Promise<number>} countInquiries
 * @property {(query: Record<string, unknown>, options: { sort: Record<string, unknown>, skip: number, limit: number }) => Promise<import('mongoose').Document[]>} findInquiries
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findInquiryById
 * @property {(promptQuestion: string) => Promise<import('mongoose').Document|null>} findInquiryByPromptQuestion
 * @property {(promptQuestion: string, id: string) => Promise<import('mongoose').Document|null>} findInquiryByPromptQuestionExcludingId
 * @property {(inquiry: import('mongoose').Document) => Promise<import('mongoose').Document>} saveInquiry
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createInquiry
 * @property {(id: string) => Promise<import('mongoose').Document|null>} deleteInquiryById
 * @property {(data: Record<string, unknown>) => Promise<import('mongoose').Document>} createInquiryRelevance
 * @property {(id: string) => Promise<import('mongoose').Document|null>} findInquiryRelevanceById
 * @property {(filter: Record<string, unknown>, update: Record<string, unknown>) => Promise<import('mongoose').UpdateWriteOpResult>} updateInquiryRelevanceMany
 * @property {(pipeline: Record<string, unknown>[]) => Promise<unknown[]>} aggregateInquiryRelevance
 */

export const countInquiries = (query) => Inquiry.countDocuments(query);

export const findInquiries = (query, { sort, skip, limit }) =>
  Inquiry.find(query).sort(sort).skip(skip).limit(limit);

export const findInquiryById = (id) => Inquiry.findById(id);

export const findInquiryByPromptQuestion = (promptQuestion) =>
  Inquiry.findOne({ promptQuestion });

export const findInquiryByPromptQuestionExcludingId = (promptQuestion, id) =>
  Inquiry.findOne({ promptQuestion, _id: { $ne: id } });

export const saveInquiry = (inquiry) => inquiry.save();

export const createInquiry = (data) => Inquiry.create(data);

export const deleteInquiryById = (id) => Inquiry.findByIdAndDelete(id);

export const createInquiryRelevance = (data) => InquiryRelevance.create(data);

export const findInquiryRelevanceById = (id) => InquiryRelevance.findById(id);

export const updateInquiryRelevanceMany = (filter, update) =>
  InquiryRelevance.updateMany(filter, update);

export const aggregateInquiryRelevance = (pipeline) =>
  InquiryRelevance.aggregate(pipeline);

/** @type {InquiryRepository} */
export const inquiryRepository = {
  countInquiries,
  findInquiries,
  findInquiryById,
  findInquiryByPromptQuestion,
  findInquiryByPromptQuestionExcludingId,
  saveInquiry,
  createInquiry,
  deleteInquiryById,
  createInquiryRelevance,
  findInquiryRelevanceById,
  updateInquiryRelevanceMany,
  aggregateInquiryRelevance
};
