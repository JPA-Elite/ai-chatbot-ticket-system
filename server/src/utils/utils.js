import { franc } from "franc"; // works only if the package exports named exports
import multer from 'multer';
import openai from "../config/openaiClient.js";

export const detectEnglishLanguage = (text) => {
    const langCode = franc(text);
    return langCode === 'eng';
}

export const upload = multer({
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB hard limit (safety net)
    },
});

export const escapeRegex = (text) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createChatCompletion = (options) =>
    openai.chat.completions.create(options);

export const normalizeInquiryText = (value = "") =>
    String(value)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export const computeTokenOverlap = (left = "", right = "") => {
    const leftTokens = new Set(normalizeInquiryText(left).split(" ").filter(Boolean));
    const rightTokens = new Set(normalizeInquiryText(right).split(" ").filter(Boolean));

    if (!leftTokens.size || !rightTokens.size) return 0;

    let intersection = 0;
    for (const token of leftTokens) {
        if (rightTokens.has(token)) intersection += 1;
    }

    const union = new Set([...leftTokens, ...rightTokens]);
    return intersection / union.size;
};
