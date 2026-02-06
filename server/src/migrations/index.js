import { runTicketClassifierMigration } from './ticket-classifier.js';

const migrations = {
  'ticket-classifier': runTicketClassifierMigration
};

export function getMigration(name) {
  return migrations[name];
}

export function listMigrations() {
  return Object.keys(migrations);
}

export async function runMigration(name, options) {
  const migration = getMigration(name);
  if (!migration) {
    const available = listMigrations();
    throw new Error(
      `Unknown migration: ${name}. Available migrations: ${available.length ? available.join(', ') : 'none'}`
    );
  }

  return migration(options);
}
