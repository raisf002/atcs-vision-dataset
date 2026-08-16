CREATE TABLE `cameras` (
	`id` varchar(96) NOT NULL,
	`name` varchar(255) NOT NULL,
	`zone` enum('city','national') NOT NULL,
	`sourceUrl` text,
	`sourceKind` enum('hls','snapshot') NOT NULL DEFAULT 'hls',
	`sourceStatus` enum('pending','verified','invalid') NOT NULL DEFAULT 'pending',
	`isActive` boolean NOT NULL DEFAULT false,
	`captureCount` bigint NOT NULL DEFAULT 0,
	`lastCaptureAt` timestamp,
	`lastCaptureStatus` enum('disabled','pending','success','failed') NOT NULL DEFAULT 'disabled',
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cameras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `captureErrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cameraId` varchar(96) NOT NULL,
	`message` text NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `captureErrors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `captureSettings` (
	`id` int NOT NULL,
	`intervalMinutes` enum('1','5','10','15') NOT NULL DEFAULT '5',
	`isEnabled` boolean NOT NULL DEFAULT false,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `captureSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `datasetExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestedByUserId` int NOT NULL,
	`cameraId` varchar(96),
	`fromDate` timestamp NOT NULL,
	`toDate` timestamp NOT NULL,
	`status` enum('queued','building','ready','failed') NOT NULL DEFAULT 'queued',
	`fileCount` int NOT NULL DEFAULT 0,
	`archiveStorageKey` varchar(512),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `datasetExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cameraId` varchar(96) NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`contentType` varchar(96) NOT NULL DEFAULT 'image/jpeg',
	`sizeBytes` bigint NOT NULL DEFAULT 0,
	`width` int,
	`height` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `snapshots_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
ALTER TABLE `captureErrors` ADD CONSTRAINT `captureErrors_cameraId_cameras_id_fk` FOREIGN KEY (`cameraId`) REFERENCES `cameras`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `datasetExports` ADD CONSTRAINT `datasetExports_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshots` ADD CONSTRAINT `snapshots_cameraId_cameras_id_fk` FOREIGN KEY (`cameraId`) REFERENCES `cameras`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cameras_zone_idx` ON `cameras` (`zone`);--> statement-breakpoint
CREATE INDEX `cameras_status_idx` ON `cameras` (`sourceStatus`,`isActive`);--> statement-breakpoint
CREATE INDEX `capture_errors_camera_occurred_idx` ON `captureErrors` (`cameraId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `dataset_exports_user_created_idx` ON `datasetExports` (`requestedByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `snapshots_camera_captured_idx` ON `snapshots` (`cameraId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `snapshots_captured_idx` ON `snapshots` (`capturedAt`);