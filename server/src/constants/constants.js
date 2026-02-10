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

export const THANK_YOU_KEYWORDS = [
  "thanks",
  "thank you",
  "thank you so much",
  "thank you very much",
  "thanks a lot",
  "many thanks",
  "much appreciated",
  "appreciate it",
  "appreciate your help",
  "have a nice day",
  "have a great day",
  "have a good day"
];

export const THANK_YOU_RESPONSES = [
  "You're welcome! Please ask me anytime if you need help.",
  "You're very welcome! I'm here whenever you need assistance.",
  "Anytime! Feel free to ask if there's anything else I can help with.",
  "Glad I could help! You can always reach out again.",
  "You're welcome, and have a great day too!"
];

export const THANK_YOU_CLOSING_KEYWORDS = [
  "no",
  "nope",
  "nah",
  "nothing",
  "nothing else",
  "no nothing else",
  "thats all",
  "that s all",
  "all good",
  "im good",
  "i'm good"
];

export const THANK_YOU_CLOSING_RESPONSES = [
  "You're welcome! Have a great day.",
  "You're very welcome. Take care!",
  "Glad I could help—have a nice day!",
  "Anytime. Wishing you a great day ahead!"
];

const asBulletList = (items = []) => items.map(item => `- "${item}"`).join("\n");

export const GREETING_RESPONSE_OPTIONS_TEXT = asBulletList(GREETING_RESPONSES);
export const THANK_YOU_KEYWORDS_OPTIONS_TEXT = asBulletList(THANK_YOU_KEYWORDS);
export const THANK_YOU_RESPONSE_OPTIONS_TEXT = asBulletList(THANK_YOU_RESPONSES);
export const THANK_YOU_CLOSING_RESPONSE_OPTIONS_TEXT = asBulletList(THANK_YOU_CLOSING_RESPONSES);

export const POLITE_NEUTRAL_KEYWORDS = [
  "ah",
  "ahh",
  "ahhh",
  "okay",
  "ok",
  "alright",
  "sure"
];

export const FEEDBACK_POSITIVE_KEYWORDS = [
  "you are correct",
  "you're correct",
  "youre correct",
  "you are right",
  "you're right",
  "youre right",
  "correct",
  "right",
  "yes correct",
  "that is correct",
  "thats correct",
  "exactly",
  "spot on"
];

export const FEEDBACK_NEGATIVE_KEYWORDS = [
  "you are wrong",
  "you're wrong",
  "youre wrong",
  "wrong",
  "nah",
  "nahh",
  "no wrong",
  "not correct",
  "that is wrong",
  "thats wrong",
  "incorrect",
  "not right"
];

export const FEEDBACK_POSITIVE_RESPONSES = [
  "Thanks for confirming! Let me know if you'd like help with anything else.",
  "Great, thanks for confirming that.",
  "Awesome—glad that was correct.",
  "Perfect, thanks for the feedback!",
  "Noted, thank you for confirming.",
  "Glad we're aligned. Feel free to ask more.",
  "Great to hear! I'm here if you need anything else.",
  "Thanks! Happy to help further anytime.",
  "Excellent, thanks for validating that.",
  "Appreciate the confirmation!"
];

export const FEEDBACK_NEGATIVE_RESPONSES = [
  "Ah, sorry about that. I might not be able to answer this accurately—please create a support ticket so staff can help.",
  "You're right, my bad. I can't fully answer this one—please file a ticket for proper assistance.",
  "Sorry, I got that wrong. Please open a support ticket so a staff member can assist you better.",
  "Thanks for the correction—sorry! I can't confidently resolve this, so please contact support staff.",
  "My apologies. I may not have the correct answer here; please submit a ticket for expert help.",
  "Sorry for that. I can't fully assist on this case—please reach out to support via ticket.",
  "You're right to flag that. I may be missing details, so please file a support ticket.",
  "Apologies—my response wasn't accurate. Please create a ticket and our staff will guide you.",
  "I’m sorry about that. I can't provide a reliable answer here; please contact support staff.",
  "My bad, and thanks for pointing it out. Please submit a ticket so this can be handled properly."
];

export const FEEDBACK_POSITIVE_OPTIONS_TEXT = asBulletList(FEEDBACK_POSITIVE_RESPONSES);
export const FEEDBACK_NEGATIVE_OPTIONS_TEXT = asBulletList(FEEDBACK_NEGATIVE_RESPONSES);

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
export const GREETING_ONLY_MSG = "Greetings message";
export const THANK_YOU_ONLY_MSG = "Thank-you message";
export const CLOSE_ONLY_MSG = "Close message";
export const FEEDBACK_POSITIVE_MSG = "Positive feedback message";
export const FEEDBACK_NEGATIVE_MSG = "Negative feedback message";
export const ESCALATION_NEEDED_RESPONSE = "Conversation requires escalation to human agent.";
export const RESPOND_TO_ESCALATION_MSG = "I can't fully assist with your request. Try asking a different question or contacting support by filing a ticket to our staff."

export const STAFF_ROLES = ["staff", "admin"];

export const STAFF_SELECTION_MAX_RESULTS = 50;

export const STAFF_TAG_DEFAULT = "General";
export const STAFF_CONCERN_PREVIEW_LIMIT = 4;

export const STAFF_NUMBER_SELECTION_REGEX = /^\s*(\d{1,2})\s*$/;
export const DEFAULT_STAFF_NAME = "Unknown Staff";
export const DEFAULT_STAFF_ROLE = "staff";
export const DEFAULT_STAFF_EMAIL = "No email";
export const STAFF_SELECTION_FALLBACK_MESSAGE = "I can help you file a support ticket. Please tell me the specific concern (for example: Enrollment, Admission, TCG, Thesis, or AMIS concerns) so I can assign it to the right staff member.";
export const STAFF_SELECTION_INTRO_LINES = [
  "I can help you file a support ticket.",
  "Please choose one of the following staff members and share your concern category so I can route your ticket correctly:"
];
export const STAFF_SELECTION_EXAMPLE_REPLY = "Example reply: Reply with a number (e.g., 1, 2, 3) to select a staff, or type your request.";

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
- If latest message is greeting-only, return EXACTLY ONE response from GREETING_RESPONSES below.
- If latest message is gratitude-only (matches THANK_YOU_KEYWORDS intent), return EXACTLY ONE response from THANK_YOU_RESPONSES below.
- If latest message is gratitude+closing-only, return EXACTLY ONE response from THANK_YOU_CLOSING_RESPONSES below.
- If latest message is positive correctness feedback (e.g., "you are correct"), return EXACTLY ONE response from FEEDBACK_POSITIVE_RESPONSES below.
- If latest message is negative correctness feedback (e.g., "you are wrong", "nahh you're wrong"), return EXACTLY ONE response from FEEDBACK_NEGATIVE_RESPONSES below.
- For all other non-escalation cases, return EXACTLY the RESPOND_TO_ESCALATION_MSG constant.

Allowed GREETING_RESPONSES:
${GREETING_RESPONSE_OPTIONS_TEXT}

THANK_YOU_KEYWORDS intent hints:
${THANK_YOU_KEYWORDS_OPTIONS_TEXT}

Allowed THANK_YOU_RESPONSES:
${THANK_YOU_RESPONSE_OPTIONS_TEXT}

Allowed THANK_YOU_CLOSING_RESPONSES:
${THANK_YOU_CLOSING_RESPONSE_OPTIONS_TEXT}

Allowed FEEDBACK_POSITIVE_RESPONSES:
${FEEDBACK_POSITIVE_OPTIONS_TEXT}

Allowed FEEDBACK_NEGATIVE_RESPONSES:
${FEEDBACK_NEGATIVE_OPTIONS_TEXT}

Routing/escalation is REQUIRED if the user:
- asks for a real person, human agent, live support, or support staff
- asks to contact, talk to, speak with, or be connected to staff
- asks who the staff are / asks for staff directory/contact routing
- asks for staff assistance even with awkward grammar or typos
- asks to file/create/open/submit a ticket, or asks how to do those steps
- reports issues beyond chatbot scope (bugs, errors, account, payment, billing)

Examples that MUST return YES:
- "Can you help me assist me"
- "I need assistance please help me"
- "Can you help me, I don't know how to do"
- "i would like assistance for your staff"
- "can you help me how to assist me for the staff here"
- "who are the staff can i talk with"
- "can you help me file a ticket"

Do NOT escalate for generic non-routing questions like:
- "hello"
- gratitude/closing-only messages (e.g., "thank you", "thanks", "okay thank you", "no nothing else thank you")
- greeting-only messages (e.g., "hi", "hello there")

For non-escalation:
- greeting-only => return exactly one response from GREETING_RESPONSES
- gratitude-only => return exactly one response from THANK_YOU_RESPONSES
- gratitude+closing-only => return exactly one response from THANK_YOU_CLOSING_RESPONSES
- positive correctness feedback => return exactly one response from FEEDBACK_POSITIVE_RESPONSES
- negative correctness feedback => return exactly one response from FEEDBACK_NEGATIVE_RESPONSES
- otherwise return EXACTLY: "${RESPOND_TO_ESCALATION_MSG}"`;

export const ESCALATION_ROUTER_USER_PROMPT_TEMPLATE = (conversationText) => `You are a support assistant AI. Analyze the following conversation and determine if it should be escalated to a human agent.
Return ONLY "YES" if escalation is needed, if not return a response.

Conversation:
${conversationText}`;
