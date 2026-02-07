import InquiryRelevance from '../models/InquiryRelevance.js';

/** @typedef {import('../interfaces/pythonRepositoryTypes.js').PythonRepository} PythonRepository */

export const fetchRelevanceData = async () => {
  const batchSize = 10000;
  const totalRecords = await InquiryRelevance.countDocuments({});
  const totalPages = Math.ceil(totalRecords / batchSize);
  const allRecords = [];

  for (let page = 0; page < totalPages; page += 1) {
    const batch = await InquiryRelevance.find({}, 'similarityScore isRelevant')
      .skip(page * batchSize)
      .limit(batchSize)
      .lean();
    allRecords.push(...batch);
  }

  return allRecords;
};

/** @type {PythonRepository} */
export const pythonRepository = {
  fetchRelevanceData
};
