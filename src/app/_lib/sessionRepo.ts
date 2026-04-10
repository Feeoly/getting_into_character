import { db } from "./db";
import { SESSION_SCHEMA, type Session } from "./sessionTypes";

export async function listSessions(): Promise<Session[]> {
  const rows = await db.sessions.orderBy("createdAt").reverse().toArray();
  const sessions: Session[] = [];

  for (const row of rows) {
    const parsed = SESSION_SCHEMA.safeParse(row);
    if (parsed.success) sessions.push(parsed.data);
  }

  return sessions;
}

