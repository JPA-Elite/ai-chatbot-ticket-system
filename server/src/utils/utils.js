import { franc } from "franc"; // works only if the package exports named exports
import multer from 'multer';

export const detectEnglishLanguage = (text) => {
    const langCode = franc(text);
    return langCode === 'eng';
}

export const upload = multer({
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB hard limit (safety net)
    },
});