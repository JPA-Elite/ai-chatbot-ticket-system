import openai from "../config/openaiClient.js";
import { createChatCompletion, detectEnglishLanguage } from "../utils/utils.js";
import {
  FILLER_PHRASES,
  GREETING_KEYWORDS,
  GREETING_RESPONSES,
  THANK_YOU_KEYWORDS,
  THANK_YOU_RESPONSES,
  RESPOND_TO_ESCALATION_MSG,
  ESCALATION_NEEDED_MSG,
  ESCALATION_NEEDED_RESPONSE
} from "../constants/constants.js";
import {
  createInquiryRelevance,
  findEnabledInquiries
} from "../repositories/inquiryRepository.js";
import {
  buildCanonicalizeQuestionMessages,
  buildEscalationDecisionMessages,
  buildInquiryGenerationMessages,
  buildResponseLanguageMatchMessages,
  buildTranslationMessages
} from "./openaiPrompts.js";
import { predictTrainingData } from "./pythonAPIService.js";

// Mock AI Service for testing without OpenAI API key

/**
 * Mock responses for testing
 */
const mockResponses = [
  "I understand you're asking about our services. Let me help you with that information.",
  "That's a great question! Based on what you're asking, here's what I can tell you...",
  "I can help you with basic inquiries, but for more complex issues, I'll need to escalate this to our support team.",
  "Thank you for your question. This seems like something that requires specialized knowledge, so I'll create a support ticket for you.",
  "I'm not able to fully address this technical issue. Let me escalate this to a human agent who can provide better assistance.",
  "This appears to be a billing-related question that I cannot handle. I'll create a ticket for our billing team to review."
]; 

const escalationTriggers = [
  "billing", "payment", "refund", "technical issue", "bug", "error",
  "not working", "broken", "complex", "advanced", "specialist", "urgent"
];

function detectPoliteOnlyMessageType(message = "") {
  const normalized = String(message)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  const words = normalized.split(" ");
  if (words.length > 10) return null;

  const phraseTypes = new Map([
    ...GREETING_KEYWORDS.map((phrase) => [phrase, "greeting"]),
    ...THANK_YOU_KEYWORDS.map((phrase) => [phrase, "thank"])
  ]);

  function walk(remainingWords, hasGreeting = false, hasThank = false) {
    if (remainingWords.length === 0) {
      if (hasThank) return "thank";
      if (hasGreeting) return "greeting";
      return null;
    }

    for (let i = remainingWords.length; i > 0; i -= 1) {
      const phrase = remainingWords.slice(0, i).join(" ");
      const type = phraseTypes.get(phrase);
      if (!type) continue;

      const next = walk(
        remainingWords.slice(i),
        hasGreeting || type === "greeting",
        hasThank || type === "thank"
      );

      if (next) return next;
    }

    return null;
  }

  return walk(words);
}

/**
 * Analyze conversation for escalation using AI
 * @param {Array} chatHistory - Full conversation history
 * @param {String} latestMessage - Latest AI-generated message
 * @returns {Boolean|String} - true if escalation needed, else AI response
 */
export async function analyzeConversation(chatHistory, latestMessage = "", isRespondToEscalation = true, startResponseTime = Date.now()) {
  try {
    const rawMessage = String(latestMessage || "").toLowerCase().trim();
    const rawPoliteType = rawMessage.length <= 60 ? detectPoliteOnlyMessageType(rawMessage) : null;

    if (rawPoliteType === "thank") {
      return THANK_YOU_RESPONSES[Math.floor(Math.random() * THANK_YOU_RESPONSES.length)];
    }

    if (rawPoliteType === "greeting") {
      return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
    }

    const translatedMessage = await detectAndTranslateToEnglish(latestMessage);
    const msg = String(translatedMessage || "").toLowerCase().trim();
    const translatedPoliteType = msg.length <= 60 ? detectPoliteOnlyMessageType(msg) : null;

    if (translatedPoliteType === "thank") {
      return THANK_YOU_RESPONSES[Math.floor(Math.random() * THANK_YOU_RESPONSES.length)];
    }

    if (translatedPoliteType === "greeting") {
      return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
    }

    const trainingPrediction = await predictTrainingData({ userInquiry: latestMessage });
    const prediction = trainingPrediction.status === 200 ? trainingPrediction.payload?.prediction : null;
    if (prediction?.is_escalated && prediction?.confidence >= 0.7) {
      const responseTime = Date.now() - startResponseTime;
      await createInquiryRelevance({
        userInquiry: latestMessage,
        generatedInquiry: ESCALATION_NEEDED_MSG,
        generatedResponse: ESCALATION_NEEDED_RESPONSE,
        similarityScore: prediction.confidence,
        responsTime: responseTime,
        isRelevant: 1
      });
      return true;
    }

    const aiDecision = await generateChatResponse(
      buildEscalationDecisionMessages(chatHistory)
    );

    console.log("AI Escalation Decision:", aiDecision);

    // Normalize response and return boolean
    if (aiDecision.trim().toUpperCase() === "YES") {
      const responseTime = Date.now() - startResponseTime;
        await createInquiryRelevance({
        userInquiry: latestMessage,
        generatedInquiry: ESCALATION_NEEDED_MSG,
        generatedResponse: ESCALATION_NEEDED_RESPONSE,
        similarityScore: 1,
        responsTime: responseTime,
        isRelevant: 1
        });
      return true;
    } else {
      // if (getRuleBasedResponse(latestMessage)) {
      //   return getRuleBasedResponse(latestMessage);
      // }

      // From custom inquiries AI training model
      const relevantInquiries = await findRelevantInquiriesAI(latestMessage);
      if (relevantInquiries.length > 0 && relevantInquiries[0].score >= 0.5) {
        const responseTime = Date.now() - startResponseTime;
        await createInquiryRelevance({
          userInquiry: latestMessage,
          generatedInquiry: relevantInquiries[0].inquiry.promptQuestion,
          generatedResponse: relevantInquiries[0].inquiry.promptResponse,
          similarityScore: relevantInquiries[0].score,
          responsTime: responseTime,
          isRelevant: 1
        });

        return relevantInquiries[0].inquiry.promptResponse;
      }

      if (isRespondToEscalation) {
        const responseTime = Date.now() - startResponseTime;
        await createInquiryRelevance({
          userInquiry: latestMessage,
          generatedInquiry: ESCALATION_NEEDED_MSG,
          generatedResponse: RESPOND_TO_ESCALATION_MSG,
          similarityScore: relevantInquiries.length > 0 ? relevantInquiries[0].score : 0,
          responsTime: responseTime,
          isRelevant: 1
        });

        return RESPOND_TO_ESCALATION_MSG;
      }

      return aiDecision; // return the AI's response if no escalation needed
    }

  } catch (error) {
    console.error("Error in AI conversation analysis:", error);
    return "I'm sorry, but I'm currently unable to process your request. Please try again later.";
  }
}

/**
 * Mock function to simulate ticket classification
 * @param {String} description - Ticket description
 * @param {Array} chatMessages - Related chat messages for context
 * @returns {Object} - Category and priority
 */
export const classifyTicket = async (description, chatMessages = []) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const descriptionLower = description.toLowerCase();

    // Simple keyword-based classification
    let category = 'other';
    let priority = 'medium';

    // Determine category
    if (descriptionLower.includes('billing') || descriptionLower.includes('payment') || descriptionLower.includes('refund')) {
      category = 'billing';
    } else if (descriptionLower.includes('technical') || descriptionLower.includes('bug') || descriptionLower.includes('error')) {
      category = 'technical';
    } else if (descriptionLower.includes('account') || descriptionLower.includes('login') || descriptionLower.includes('password')) {
      category = 'account';
    } else if (descriptionLower.includes('feature') || descriptionLower.includes('request')) {
      category = 'feature';
    }

    // Determine priority
    if (descriptionLower.includes('urgent') || descriptionLower.includes('critical') || descriptionLower.includes('emergency')) {
      priority = 'urgent';
    } else if (descriptionLower.includes('important') || descriptionLower.includes('high')) {
      priority = 'high';
    } else if (descriptionLower.includes('low') || descriptionLower.includes('minor')) {
      priority = 'low';
    }

    console.log(`Mock AI Classification: Category: ${category}, Priority: ${priority}`);

    return { category, priority };

  } catch (error) {
    console.error('Error in mock ticket classification:', error);
    return { category: 'other', priority: 'medium' };
  }
};

/**
 * Generate mock AI response based on user input
 * @param {String} userMessage - User's message
 * @param {Array} chatHistory - Previous chat messages
 * @returns {String} - Mock AI response
 */
export const generateMockResponse = (userMessage, chatHistory = []) => {
  const messageLower = userMessage.toLowerCase();

  // Check for escalation triggers
  const shouldEscalate = escalationTriggers.some(trigger =>
    messageLower.includes(trigger)
  );

  if (shouldEscalate) {
    return "I understand this is a complex issue that requires specialized attention. I'm not able to fully address this myself, so I'll create a support ticket to connect you with one of our expert team members who can provide the detailed assistance you need.";
  }

  // Greeting responses
  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
    return "Hello! I'm your AI support assistant. I'm here to help answer your questions and provide support. What can I assist you with today?";
  }

  // Help responses
  if (messageLower.includes('help') || messageLower.includes('support')) {
    return "I'm here to help! I can assist with general questions about our services, account information, and basic troubleshooting. If you have a specific question, feel free to ask and I'll do my best to help you.";
  }

  // Product/service questions
  if (messageLower.includes('product') || messageLower.includes('service') || messageLower.includes('feature')) {
    return "I'd be happy to help you learn more about our products and services. Could you tell me specifically what you'd like to know? I can provide information about features, pricing, and general usage.";
  }

  // Account questions
  if (messageLower.includes('account') && !messageLower.includes('problem')) {
    return "For account-related questions, I can help with general information. If you need to make changes to your account or access specific account details, I may need to create a support ticket for security reasons.";
  }

  // Default responses
  const responses = [
    "That's an interesting question! Let me provide you with some helpful information about that.",
    "I understand what you're asking about. Here's what I can tell you based on the information available to me.",
    "Thank you for reaching out! I'll do my best to help you with that inquiry.",
    "I appreciate you contacting our support. Let me see how I can assist you with this.",
    "That's a good question! I can provide some general guidance on this topic."
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Check if message matches predefined responses
 * @param {String} message
 * @returns {String|null} - Response or null if no match
 */
export function getRuleBasedResponse(message) {
  if (!message) return null;

  const msg = message.toLowerCase().trim();

  const politeType = detectPoliteOnlyMessageType(msg);
  if (politeType === "thank") {
    return THANK_YOU_RESPONSES[
      Math.floor(Math.random() * THANK_YOU_RESPONSES.length)
    ];
  }

  if (politeType === "greeting") {
    return GREETING_RESPONSES[
      Math.floor(Math.random() * GREETING_RESPONSES.length)
    ];
  }

  // Help responses
  if (msg.includes("help") || msg.includes("support")) {
    return "I'm here to help! Please tell me your concern.";
  }

  // Account questions
  if (msg.includes("account") && !msg.includes("problem")) {
    return "For account-related questions, I may need to create a support ticket for security purposes.";
  }

  if (!message) return null;

  const messageLower = message.toLowerCase();

  // Greeting responses
  if (
    messageLower.includes("hello") ||
    messageLower.includes("hi") ||
    messageLower.includes("hey")
  ) {
    return "Hello! I'm your AI support assistant. I'm here to help answer your questions and provide support. What can I assist you with today?";
  }

  // Help responses
  if (
    messageLower.includes("help") ||
    messageLower.includes("support")
  ) {
    return "I'm here to help! I can assist with general questions about our services, account information, and basic troubleshooting. If you have a specific question, feel free to ask and I'll do my best to help you.";
  }

  // Product / service questions
  if (
    messageLower.includes("product") ||
    messageLower.includes("service") ||
    messageLower.includes("feature")
  ) {
    return "I'd be happy to help you learn more about our products and services. Could you tell me specifically what you'd like to know? I can provide information about features, pricing, and general usage.";
  }

  // Account questions (non-problem)
  if (
    messageLower.includes("account") &&
    !messageLower.includes("problem")
  ) {
    return "For account-related questions, I can help with general information. If you need to make changes to your account or access specific account details, I may need to create a support ticket for security reasons.";
  }

  return null; // fallback to AI
}

/**
 * Generate AI chat response using OpenAI
 * @param {Array} messages - Array of messages for context [{role, content}]
 * @returns {String} - AI-generated response
 */
export async function generateChatResponse(messages) {
  const response = await createChatCompletion({
    model: process.env.CHATGPT_MODEL,
    messages,
    temperature: 0,
  });

  return response.choices[0].message.content;
}

/**
 * Create embedding for given text using OpenAI
 * @param {String} text - Input text
 * @returns {Array} - Embedding vector
 */
export async function createEmbedding(text) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return embedding.data[0].embedding;
}

/**
 *
 * @param {*} a - First vector
 * @param {*} b - Second vector
 * @returns {Number} - Cosine similarity value between 0 and 1
 */
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Find relevant inquiries based on user question using embeddings
 * Supports multilingual inquiries
 * @param {String} userQuestion - User's question
 * @returns {Array} - Relevant inquiries
 */
export async function findRelevantInquiriesAI(userQuestion) {
  const englishQuestion = await detectAndTranslateToEnglish(userQuestion);
  const canonicalQuestion = await canonicalizeQuestion(englishQuestion);
  const userEmbedding = await createEmbedding(preprocessText(canonicalQuestion, true));
  const inquiries = await findEnabledInquiries();

  const scored = await Promise.all(inquiries.map(async (inquiry) => {
    let inquiryText = inquiry.promptQuestion;

    if (!detectEnglishLanguage(inquiryText)) {
      // Temporarily translate to English to compute embedding
      inquiryText = await detectAndTranslateToEnglish(inquiryText);
    }

    const embedding = inquiry.embedding && detectEnglishLanguage(inquiry.promptQuestion)
      ? inquiry.embedding
      : await createEmbedding(preprocessText(inquiryText, true));

    const score = cosineSimilarity(userEmbedding, embedding);
    return { inquiry, score };
  }));

  console.log("Relevant Inquiries Scores:", scored.sort((a, b) => b.score - a.score)[0]);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 1); // return top 1
}

/**
 * Preprocess text for embedding generation (multilingual safe)
 * @param {String} text - Input text
 * @returns {String} - Preprocessed text
 */
export function preprocessText(text, removeFillerPhrases = false) {
  let result = text.toLowerCase().normalize("NFKC");

  if (!removeFillerPhrases) {
    return result;
  }

  for (const phrase of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, "g");
    result = result.replace(regex, "");
  }

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Detect language and translate to English using OpenAI
 * @param {string} text - User input text
 * @returns {Promise<string>} - English text
 */
export async function detectAndTranslateToEnglish(text) {
  if (detectEnglishLanguage(text)){
    return text;
  }

  try {
    const response = await createChatCompletion({
      model: process.env.CHATGPT_MODEL,
      messages: buildTranslationMessages(text),
      temperature: 0
    });

    const translatedText = response.choices[0].message.content.trim();
    return translatedText;
  } catch (error) {
    console.error("OpenAI translation error:", error);
    return text; // fallback to original text
  }
}

/**
 * Rewrite assistant response to match the user's language
 * @param {string} userMessage - Latest user message
 * @param {string} assistantResponse - Generated assistant response
 * @returns {Promise<string>} - Language-matched response
 */
export async function matchResponseLanguage(userMessage, assistantResponse) {
  if (!assistantResponse) {
    return assistantResponse;
  }

  if (detectEnglishLanguage(String(userMessage || ""))) {
    return assistantResponse;
  }

  try {
    const response = await createChatCompletion({
      model: process.env.CHATGPT_MODEL,
      messages: buildResponseLanguageMatchMessages(userMessage, assistantResponse),
      temperature: 0
    });

    return response.choices[0].message.content.trim() || assistantResponse;
  } catch (error) {
    console.error("OpenAI response language match error:", error);
    return assistantResponse;
  }
}

/**
 * Generate AI-based inquiries from text content (unique, student-level & human-like, 100% accurate)
 * Fully AI-driven: detects existing Q&A or generates new inquiries
 * Handles impossible inquiry requests
 * @param {string} content - Source text content
 * @param {number} count - Number of inquiries to generate (ignored if content is already Q&A)
 * @returns {Promise<Array<{question: string, answer: string}>>} - Array of inquiries
 */
export async function generateInquiriesAI(content, count = 1) {
  try {
    const response = await createChatCompletion({
      model: process.env.CHATGPT_MODEL,
      messages: buildInquiryGenerationMessages(content, count),
      temperature: 0
    });

    const rawOutput = response.choices[0].message.content.trim();

    // Parse JSON safely
    const inquiries = JSON.parse(rawOutput);
    return inquiries;
  } catch (error) {
    console.error("OpenAI inquiry generation error:", error);
    return [];
  }
}

/**
 *
 * @param {*} question
 * @returns {Promise<String>} - Canonicalized question
 */
export async function canonicalizeQuestion(question) {
  const response = await createChatCompletion({
    model: process.env.CHATGPT_MODEL,
    temperature: 0,
    messages: buildCanonicalizeQuestionMessages(question)
  });

  return response.choices[0].message.content.trim().toLowerCase();
}
