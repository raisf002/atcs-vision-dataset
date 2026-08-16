import { bigint, boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const cameras = mysqlTable("cameras", {
  id: varchar("id", { length: 96 }).primaryKey(),
  sortOrder: int("sortOrder").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  zone: mysqlEnum("zone", ["city", "national"]).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceKind: mysqlEnum("sourceKind", ["hls", "snapshot"]).default("hls").notNull(),
  sourceStatus: mysqlEnum("sourceStatus", ["pending", "verified", "invalid"]).default("pending").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  captureCount: bigint("captureCount", { mode: "number" }).default(0).notNull(),
  lastCaptureAt: timestamp("lastCaptureAt"),
  lastCaptureStatus: mysqlEnum("lastCaptureStatus", ["disabled", "pending", "success", "failed"]).default("disabled").notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("cameras_zone_idx").on(table.zone), index("cameras_status_idx").on(table.sourceStatus, table.isActive)]);

export const captureSettings = mysqlTable("captureSettings", {
  id: int("id").primaryKey(),
  intervalMinutes: mysqlEnum("intervalMinutes", ["1", "5", "10", "15"]).default("5").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: varchar("cameraId", { length: 96 }).notNull().references(() => cameras.id),
  capturedAt: timestamp("capturedAt").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  contentType: varchar("contentType", { length: 96 }).default("image/jpeg").notNull(),
  sizeBytes: bigint("sizeBytes", { mode: "number" }).default(0).notNull(),
  width: int("width"),
  height: int("height"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("snapshots_camera_captured_idx").on(table.cameraId, table.capturedAt), index("snapshots_captured_idx").on(table.capturedAt)]);

export const captureErrors = mysqlTable("captureErrors", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: varchar("cameraId", { length: 96 }).notNull().references(() => cameras.id),
  message: text("message").notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => [index("capture_errors_camera_occurred_idx").on(table.cameraId, table.occurredAt)]);

export const datasetExports = mysqlTable("datasetExports", {
  id: int("id").autoincrement().primaryKey(),
  requestedByUserId: int("requestedByUserId").notNull().references(() => users.id),
  cameraId: varchar("cameraId", { length: 96 }),
  fromDate: timestamp("fromDate").notNull(),
  toDate: timestamp("toDate").notNull(),
  status: mysqlEnum("status", ["queued", "building", "ready", "failed"]).default("queued").notNull(),
  fileCount: int("fileCount").default(0).notNull(),
  archiveStorageKey: varchar("archiveStorageKey", { length: 512 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [index("dataset_exports_user_created_idx").on(table.requestedByUserId, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type Snapshot = typeof snapshots.$inferSelect;
