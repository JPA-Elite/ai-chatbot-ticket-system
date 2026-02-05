export const MAX_CHARS = 100_000;

export const GREETING_KEYWORDS = [
  "hi",
  "hello",
  "hey",
  "hi there",
  "hello there",
  "hey there",
  "good morning",
  "good afternoon",
  "good evening",
  "good day",
  "greetings"
];

export const GREETING_RESPONSES = [
  "Hi! I'm your support chatbot. How may I help you today?",
  "Hello! 👋 How can I assist you today?",
  "Hi there! I'm here to help. What do you need?",
  "Hello! Feel free to ask me anything.",
  "Hey! 😊 How may I assist you?"
];

export const FILLER_PHRASES = [
    "may i know",
    "can you",
    "could you",
    "would you",
    "please",
    "kindly",
    "i would like to ask",
    "i want to know",
    "i need to know",
    "i was wondering",
    "do you know",
    "is it possible",
    "is there a way",
    "tell me",
    "let me know",
    "help me understand",
    "i have a question",
    "just want to ask",
    "quick question",
    "sorry",
    "excuse me",
    "thanks",
    "thank you",
    "thank you very much",
    "appreciate it",
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    // polite starters
    "may i ask",
    "can i ask",
    "could i ask",
    "would it be possible",
    "if possible",
    "if you dont mind",
    "if you could",
    "if you can",

    // intent softeners
    "i would like to know",
    "i would like to understand",
    "i am trying to understand",
    "i am trying to know",
    "i am curious about",
    "i am interested in",
    "i am looking for",
    "i am asking about",

    // conversational noise
    "just asking",
    "just checking",
    "just wondering",
    "just curious",
    "quick help",
    "quick one",
    "small question",
    "simple question",

    // request framing
    "can you tell me",
    "could you tell me",
    "would you tell me",
    "can someone tell me",
    "please tell me",
    "please explain",
    "please help",
    "please clarify",

    // acknowledgement noise
    "thanks in advance",
    "thank you in advance",
    "much appreciated",
    "really appreciate it",
    "appreciate your help",

    // greetings variants
    "good day",
    "greetings",
    "hi there",
    "hello there",
    "hey there",

    // apology / hesitation
    "sorry to ask",
    "sorry for bothering",
    "apologies",
    "my apologies",
    "pardon me",

    // vague fillers
    "about",
    "regarding",
    "related to",
    "with regards to",
    "in terms of",

    // indirect phrasing
    "i was hoping to know",
    "i was hoping you could",
    "i was hoping to understand",
    "i would appreciate if",

    // chat-style fillers
    "any idea",
    "any thoughts",
    "any chance",
    "by any chance",
    "does anyone know",

    // closing noise
    "please advise", 
    "let me ask",
    "kindly advise",
    "looking forward to your response",

    // redundancy
    "basically",
    "actually",
    "literally",
    "honestly",
    "generally"
];

export const ESCALATION_NEEDED_MSG = "Escalation needed";
export const ESCALATION_NEEDED_RESPONSE = "Conversation requires escalation to human agent.";
export const RESPOND_TO_ESCALATION_MSG = "I can't fully assist with your request. Try asking a different question or contacting support by filing a ticket."

export const STAFF_ROLES = ["staff", "admin"];

export const STAFF_SELECTION_MAX_RESULTS = 8;

export const STAFF_TAG_DEFAULT = "General";
export const STAFF_CONCERN_PREVIEW_LIMIT = 4;

export const DEFAULT_STAFF_NAME = "Unknown Staff";
export const DEFAULT_STAFF_ROLE = "staff";
export const DEFAULT_STAFF_EMAIL = "No email";
export const STAFF_SELECTION_FALLBACK_MESSAGE = "I can help you file a support ticket. Please tell me the specific concern (for example: Enrollment, Admission, TCG, Thesis, or AMIS concerns) so I can assign it to the right staff member.";
export const STAFF_SELECTION_INTRO_LINES = [
  "I can help you file a support ticket.",
  "Please choose one of the following staff members and share your concern category so I can route your ticket correctly:"
];
export const STAFF_SELECTION_EXAMPLE_REPLY = "Example reply: 'Please assign this to Karen C. De Vera for Student Records.'";

export const CHAT_SYSTEM_MESSAGE = "You are a helpful customer support assistant. Answer user questions clearly and concisely. If you cannot answer a question or the question requires specialized knowledge, indicate that the issue needs to be escalated to a support representative.";

export const CHAT_HISTORY_WINDOW = 5;
export const CHAT_HISTORY_CONTENT_LIMIT = 1000;

export const TAG_MATCH_STOP_WORDS = [
  "the", "and", "for", "with", "from", "that", "this", "your", "you",
  "our", "are", "can", "help", "please", "about", "would", "like", "need",
  "assist", "assistance", "staff", "ticket", "support", "how", "what"
];

export const ASSIGNMENT_INTENT_REGEX = /(assign|route|forward|endorse|please assign|please route)/i;

export const ESCALATION_AUTO_TICKET_RESPONSE = "I understand this is a complex issue that requires specialized attention. I'm not able to fully address this myself, so I'll create a support ticket to connect you with one of our expert team members who can provide the detailed assistance you need.";

export const DEFAULT_TICKET_CATEGORY = "other";
export const DEFAULT_TICKET_PRIORITY = "medium";
export const DEFAULT_TICKET_STATUS = "pending";
export const TICKET_TITLE_PREVIEW_LENGTH = 50;

export const TICKET_DESCRIPTION_TEMPLATE = (message, aiResponse) => `Chat escalated to ticket. User message: ${message}

AI Response: ${aiResponse}`;

export const DEFAULT_ROUTING_DEPARTMENTS = ["support"];

export const DEPARTMENT_MAPPING = {
  technical: ["technical", "support"],
  billing: ["billing", "support"],
  account: ["support", "admissions"],
  feature: ["technical", "support"],
  bug: ["technical"],
  other: ["support"]
};

export const PRIORITY_ROUTING = {
  urgent: {
    preferSenior: true,
    maxActiveTickets: 3,
    departments: ["support", "technical", "billing", "admissions"]
  },
  high: {
    preferSenior: false,
    maxActiveTickets: 5,
    departments: ["support", "technical", "billing", "admissions"]
  },
  medium: {
    preferSenior: false,
    maxActiveTickets: 8,
    departments: ["support", "technical", "billing", "admissions"]
  },
  low: {
    preferSenior: false,
    maxActiveTickets: 10,
    departments: ["support", "technical", "billing", "admissions"]
  }
};

export const TICKET_ACTIVE_STATUSES = ["open", "in-progress"];

export const ESCALATION_ROUTER_SYSTEM_PROMPT = `You are an AI escalation router for a university support chatbot.

Task:
Decide whether the latest user intent should be routed to staff/ticket handling.

Return format (strict):
- Return ONLY "YES" when routing/escalation is needed.
- Otherwise, return ONLY a helpful assistant response text.

Routing/escalation is REQUIRED if the user:
- asks for a real person, human agent, live support, or support staff
- asks to contact, talk to, speak with, or be connected to staff
- asks who the staff are / asks for staff directory/contact routing
- asks for staff assistance even with awkward grammar or typos
- asks to file/create/open/submit a ticket, or asks how to do those steps
- reports issues beyond chatbot scope (bugs, errors, account, payment, billing)

Examples that MUST return YES:
- "i would like assistance for your staff"
- "can you help me how to assist me for the staff here"
- "who are the staff can i talk with"
- "can you help me file a ticket"

Do NOT escalate for generic non-routing questions like:
- "can you help me"
- "hello"
- normal FAQ questions answerable by the chatbot.`;

export const ESCALATION_ROUTER_USER_PROMPT_TEMPLATE = (conversationText) => `You are a support assistant AI. Analyze the following conversation and determine if it should be escalated to a human agent.
Return ONLY "YES" if escalation is needed, if not return a response.

Conversation:
${conversationText}`;
