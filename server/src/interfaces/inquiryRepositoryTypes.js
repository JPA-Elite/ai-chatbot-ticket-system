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
 * @property {() => Promise<import('mongoose').Document[]>} findEnabledInquiries
 * @property {(filter: Record<string, unknown>, options?: { select?: string, sort?: Record<string, unknown> }) => Promise<unknown[]>} findInquiryRelevanceEntries
 */

export {};
