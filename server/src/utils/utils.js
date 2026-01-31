import { franc } from "franc"; // works only if the package exports named exports

export function detectEnglishLanguage(text) {
    const langCode = franc(text);
    return langCode === 'eng';
}