import {
  ESCALATION_ROUTER_SYSTEM_PROMPT,
  ESCALATION_ROUTER_USER_PROMPT_TEMPLATE
} from '../constants/constants.js';

const formatConversation = (chatHistory = []) =>
  chatHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");

export function buildEscalationDecisionMessages(chatHistory = []) {
  return [
    {
      role: "system",
      content: ESCALATION_ROUTER_SYSTEM_PROMPT
    },
    {
      role: "user",
      content: ESCALATION_ROUTER_USER_PROMPT_TEMPLATE(formatConversation(chatHistory))
    }
  ];
}

export function buildTranslationMessages(text = "") {
  return [
    { role: "system", content: "You are a translation assistant." },
    {
      role: "user",
      content: `You are an AI translator.
Detect the language of the following text.
If it is not in English, translate it into English.
Respond ONLY with the English version.

Text:
"${text}"`
    }
  ];
}

export function buildInquiryGenerationMessages(content = "", count = 1) {
  return [
    {
      role: "system",
      content: "You are an AI assistant that creates student-level, human-like inquiry questions and answers, strictly based on the content. Follow all instructions carefully."
    },
    {
      role: "user",
      content: `You are an AI that generates inquiry questions and answers from the content provided.

INSTRUCTIONS:
1. First, detect if the content is already in Q&A format.
   - If it is, return ALL existing Q&A exactly as-is in JSON format.
   - Ignore the requested count in this case.
2. If the content is NOT in Q&A format:
   - Generate exactly ${count} inquiries that are UNIQUE, student-level, easy to understand, and human-like.
   - Only generate questions that can be answered using the text provided below.
   - Do NOT invent information or add anything not present in the content.
   - Answers must be extracted directly from the content, paraphrased if needed for readability.
   - Focus only on questions a student would naturally ask after reading the content.
   - If it is impossible to generate the requested number of inquiries (content is too short, trivial, or numeric), return an empty JSON array: []

IMPORTANT:
- Do not repeat questions or answers.
- Return ONLY a JSON array in this exact format:

[
  {
    "question": "....",
    "answer": "...."
  },
  ...
]

Content:
"""${content}"""`
    }
  ];
}

export function buildCanonicalizeQuestionMessages(question = "") {
  return [
    {
      role: "system",
      content: "You normalize questions into a single canonical English form."
    },
    {
      role: "user",
      content: `Rewrite this question into its simplest, neutral form.
Remove location fluff, politeness, and synonyms.
Respond with ONE sentence only.

Question:
"${question}"`
    }
  ];
}


export function buildResponseLanguageMatchMessages(userMessage = "", assistantResponse = "") {
  return [
    {
      role: "system",
      content: "You are a multilingual support rewriting assistant."
    },
    {
      role: "user",
      content: `Rewrite the assistant response so it matches the user's language and tone.

Rules:
- Keep the original meaning exactly.
- Keep the response concise and helpful.
- If the user message is already in English, return the response in English.
- If the user message is in Tagalog, Bisaya/Cebuano, or any other language, return the response in that same language.
- Return ONLY the rewritten response text.

User message:
"${userMessage}"

Assistant response:
"${assistantResponse}"`
    }
  ];
}

export function buildUpdatedInquiryMatchMessages(message = "", formattedEntries = "") {
  return [
    {
      role: 'system',
      content: [
        'You compare a new user message with prior inquiry relevance records.',
        'Select the single best matching record if it has the same intent.',
        'If there is no clear match, respond with isMatch=false.',
        'Return JSON: {"isMatch": boolean, "matchIndex": number|null}.'
      ].join(' ')
    },
    {
      role: 'user',
      content: [
        `User message: ${message}`,
        '',
        'Updated inquiry relevance records:',
        formattedEntries
      ].join('\n')
    }
  ];
}
