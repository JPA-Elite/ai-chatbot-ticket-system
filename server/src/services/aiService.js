import openai from "../config/openaiClient.js";

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

/**
 * Analyze conversation for escalation using AI
 * @param {Array} chatHistory - Array of chat messages [{role, content}]
 * @param {String} latestAIResponse - The AI's last response
 * @returns {Boolean} - Whether escalation is needed
 */
export async function analyzeConversation(chatHistory, latestAIResponse) {
  try {
    const prompt = `
      You are a support assistant AI. Analyze the following conversation and determine if it should be escalated to a human agent.
      Return ONLY "YES" if escalation is needed, or "NO" if not.

      Conversation:
      ${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n")}

      AI's last response:
      ${latestAIResponse}
      `;

    const aiDecision = await generateChatResponse([
      { role: "system", content: "You are an AI that decides if a conversation requires human escalation." },
      { role: "user", content: prompt }
    ]);

    console.log("AI Escalation Decision:", aiDecision);

    // Normalize response and return boolean
    return aiDecision.trim().toUpperCase() == "YES";

  } catch (error) {
    console.error("Error in AI conversation analysis:", error);
    return false;
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
 * Generate AI chat response using OpenAI
 * @param {Array} messages - Array of messages for context [{role, content}]
 * @returns {String} - AI-generated response
 */
export async function generateChatResponse(messages) {
  const response = await openai.chat.completions.create({
    model: process.env.CHATGPT_MODEL,
    messages,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
