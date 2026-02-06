import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const DEFAULT_PASSWORD = 'TempPass123!';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.resolve(__dirname, '../data/files/ticket-classifier.csv');

function stripBOM(value) {
  return value && value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

export async function runTicketClassifierMigration({ defaultPassword } = {}) {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { processed: 0, result: null };
  }

  const headers = parseCSVLine(stripBOM(lines[0]));
  const tagIndex = headers.indexOf('Tags');
  const nameIndex = headers.indexOf('Staff Concern');
  const emailIndex = headers.indexOf('Email Address');

  if (tagIndex === -1 || nameIndex === -1 || emailIndex === -1) {
    throw new Error(
      `CSV headers not found. Required: Tags, Staff Concern, Email Address. Found: ${JSON.stringify(headers)}`
    );
  }

  const byEmail = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCSVLine(lines[i]);
    const name = (cols[nameIndex] || '').trim();
    const email = (cols[emailIndex] || '').trim().toLowerCase();
    const tag = (cols[tagIndex] || '').trim();

    if (!name || !email || !tag) {
      continue;
    }

    if (!byEmail.has(email)) {
      byEmail.set(email, { name, email, tags: new Set() });
    }

    const record = byEmail.get(email);
    if (name) {
      record.name = name;
    }
    record.tags.add(tag);
  }

  const passwordToUse = defaultPassword ?? DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(passwordToUse, 10);

  const ops = Array.from(byEmail.values()).map((user) => {
    const tagsArr = Array.from(user.tags);

    return {
      updateOne: {
        filter: { email: user.email },
        update: {
          $setOnInsert: {
            email: user.email,
            password: hashedPassword,
            department: 'support',
            stats: {
              totalTickets: 0,
              resolvedTickets: 0,
              avgResolutionTime: 0,
              customerRating: 0
            },
            createdAt: new Date()
          },
          $set: {
            name: user.name,
            role: 'staff',
            isActive: true
          },
          $addToSet: {
            tags: { $each: tagsArr }
          }
        },
        upsert: true
      }
    };
  });

  if (ops.length === 0) {
    return { processed: 0, result: null };
  }

  const result = await User.collection.bulkWrite(ops, { ordered: false });

  return { processed: ops.length, result };
}
