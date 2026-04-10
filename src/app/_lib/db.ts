import Dexie, { type Table } from "dexie";

import type { Session } from "./sessionTypes";
import type {
  PauseEventRow,
  RehearsalSettingsRow,
  UploadedBackgroundRow,
} from "../session/[id]/rehearsal/_lib/rehearsalTypes";

export class AppDB extends Dexie {
  sessions!: Table<Session, string>;
  rehearsalSettings!: Table<RehearsalSettingsRow, string>;
  uploadedBackgrounds!: Table<UploadedBackgroundRow, string>;
  pauseEvents!: Table<PauseEventRow, string>;

  constructor() {
    super("gic-db");

    this.version(1).stores({
      sessions: "id, createdAt, status, scene",
    });

    this.version(2).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
    });

    this.version(3).stores({
      sessions: "id, createdAt, status, scene",
      rehearsalSettings: "sessionId, updatedAt",
      uploadedBackgrounds: "id, createdAt",
      pauseEvents: "id, sessionId, start_ms, createdAt",
    });
  }
}

export const db = new AppDB();

