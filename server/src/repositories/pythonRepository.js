import InquiryRelevance from '../models/InquiryRelevance.js';

export const fetchRelevanceData = () =>
  InquiryRelevance.find({}, 'similarityScore isRelevant')
    .limit(10000)
    .lean();
