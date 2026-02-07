import Inquiry from '../models/Inquiry.js';
import InquiryRelevance from '../models/InquiryRelevance.js';

/** @typedef {import('../interfaces/inquiryRepositoryTypes.js').InquiryRepository} InquiryRepository */

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

export const findEnabledInquiries = () => Inquiry.find({ isEnabled: true });

export const findInquiryRelevanceEntries = (filter, options = {}) => {
  const { select, sort } = options;
  const query = InquiryRelevance.find(filter);

  if (select) {
    query.select(select);
  }

  if (sort) {
    query.sort(sort);
  }

  return query.lean();
};

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
  aggregateInquiryRelevance,
  findEnabledInquiries,
  findInquiryRelevanceEntries
};
