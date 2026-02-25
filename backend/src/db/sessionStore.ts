import db from './connection.js';
import type { Session } from '../types/index.js';

export function createSession(session: Session) {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, task, plan, history, observations, status, result)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    session.id,
    session.task,
    JSON.stringify(session.plan),
    JSON.stringify(session.history),
    JSON.stringify(session.observations),
    session.status,
    session.result || null
  );
}

export function getSession(id: string): Session | undefined {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    task: row.task,
    plan: JSON.parse(row.plan),
    history: JSON.parse(row.history),
    observations: JSON.parse(row.observations),
    status: row.status,
    result: row.result
  };
}

export function updateSession(id: string, patch: Partial<Session>) {
  const current = getSession(id);
  if (!current) return undefined;

  const merged = { ...current, ...patch };

  const stmt = db.prepare(`
    UPDATE sessions SET
      plan = ?,
      history = ?,
      observations = ?,
      status = ?,
      result = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    JSON.stringify(merged.plan),
    JSON.stringify(merged.history),
    JSON.stringify(merged.observations),
    merged.status,
    merged.result || null,
    id
  );

  return merged;
}
