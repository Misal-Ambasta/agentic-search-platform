import db from './connection.js';

export interface AuthTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expiry_date?: number | null;
}

const DEFAULT_USER_ID = 'default_user';

export function saveTokens(tokens: AuthTokens, userId: string = DEFAULT_USER_ID) {
  const stmt = db.prepare(`
    INSERT INTO auth_tokens (id, tokens, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      tokens = excluded.tokens,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(userId, JSON.stringify(tokens));
}

export function getTokens(userId: string = DEFAULT_USER_ID): AuthTokens | null {
  try {
    const stmt = db.prepare('SELECT tokens FROM auth_tokens WHERE id = ?');
    const row = stmt.get(userId) as any;
    if (!row) return null;
    return JSON.parse(row.tokens);
  } catch (error) {
    console.error('ERROR: Failed to retrieve/parse tokens from DB:', error);
    return null;
  }
}
export function clearTokens(userId: string = DEFAULT_USER_ID) {
  const stmt = db.prepare('DELETE FROM auth_tokens WHERE id = ?');
  stmt.run(userId);
}
