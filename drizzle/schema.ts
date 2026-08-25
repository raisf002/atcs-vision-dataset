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
  captureIntervalMinutes: mysqlEnum("captureIntervalMinutes", ["1", "5", "10", "15"]),
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

/** Dataset-wide policy. Retention is configuration-only until an explicit cleanup workflow is approved. */
export const datasetSettings = mysqlTable("datasetSettings", {
  id: int("id").primaryKey(),
  classMapJson: text("classMapJson").notNull(),
  retentionDays: int("retentionDays").default(365).notNull(),
  retentionEnabled: boolean("retentionEnabled").default(false).notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
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

/** One canonical YOLO annotation per snapshot; annotation text is written by an admin and never alters image metadata. */
export const snapshotAnnotations = mysqlTable("snapshotAnnotations", {
  snapshotId: int("snapshotId").primaryKey().references(() => snapshots.id),
  yoloText: text("yoloText").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "rejected"]).default("draft").notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("snapshot_annotations_status_updated_idx").on(table.status, table.updatedAt)]);

export const captureErrors = mysqlTable("captureErrors", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: varchar("cameraId", { length: 96 }).notNull().references(() => cameras.id),
  message: text("message").notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => [index("capture_errors_camera_occurred_idx").on(table.cameraId, table.occurredAt)]);

export const visionModels = mysqlTable("visionModels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  framework: mysqlEnum("framework", ["yolo", "onnx", "tensorrt", "other"]).notNull(),
  format: mysqlEnum("format", ["pt", "onnx", "engine", "tflite", "other"]).notNull(),
  version: varchar("version", { length: 80 }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  storageUrl: varchar("storageUrl", { length: 512 }).notNull(),
  sizeBytes: bigint("sizeBytes", { mode: "number" }).default(0).notNull(),
  labelsJson: text("labelsJson").notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "ready", "archived"]).default("draft").notNull(),
  scope: mysqlEnum("scope", ["global", "camera"]).default("global").notNull(),
  cameraId: varchar("cameraId", { length: 96 }).references(() => cameras.id),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("vision_models_status_created_idx").on(table.status, table.createdAt), index("vision_models_scope_camera_idx").on(table.scope, table.cameraId)]);

export const cameraCountingConfigs = mysqlTable("cameraCountingConfigs", {
  cameraId: varchar("cameraId", { length: 96 }).primaryKey().references(() => cameras.id),
  modelId: varchar("modelId", { length: 64 }).references(() => visionModels.id),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  confidenceThreshold: int("confidenceThreshold").default(35).notNull(),
  virtualLinesJson: text("virtualLinesJson").notNull(),
  classFilterJson: text("classFilterJson").notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("camera_counting_model_idx").on(table.modelId)]);

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
  exportMode: mysqlEnum("exportMode", ["raw", "training"]).default("raw").notNull(),
  filtersJson: text("filtersJson"),
  manifestJson: text("manifestJson"),
  qualitySummaryJson: text("qualitySummaryJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [index("dataset_exports_user_created_idx").on(table.requestedByUserId, table.createdAt), index("dataset_exports_mode_created_idx").on(table.exportMode, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type Snapshot = typeof snapshots.$inferSelect;
export type SnapshotAnnotation = typeof snapshotAnnotations.$inferSelect;
export type DatasetSettings = typeof datasetSettings.$inferSelect;
export type VisionModel = typeof visionModels.$inferSelect;
export type CameraCountingConfig = typeof cameraCountingConfigs.$inferSelect;
