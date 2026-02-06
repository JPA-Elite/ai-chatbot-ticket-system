import Inquiry from '../models/Inquiry.js';
import InquiryRelevance from '../models/InquiryRelevance.js';

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
