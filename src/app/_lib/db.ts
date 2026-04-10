import Dexie, { type Table } from "dexie";

import type { Session } from "./sessionTypes";

export class AppDB extends Dexie {
  sessions!: Table<Session, string>;

  constructor() {
    super("gic-db");

    this.version(1).stores({
      sessions: "id, createdAt, status, scene",
    });
  }
}

export const db = new AppDB();

