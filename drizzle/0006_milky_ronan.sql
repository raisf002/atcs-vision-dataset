CREATE TABLE `datasetSettings` (
	`id` int NOT NULL,
	`classMapJson` text NOT NULL,
	`retentionDays` int NOT NULL DEFAULT 365,
	`retentionEnabled` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datasetSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshotAnnotations` (
	`snapshotId` int NOT NULL,
	`yoloText` text NOT NULL,
	`status` enum('draft','approved','rejected') NOT NULL DEFAULT 'draft',
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snapshotAnnotations_snapshotId` PRIMARY KEY(`snapshotId`)
);
--> statement-breakpoint
ALTER TABLE `datasetExports` ADD `exportMode` enum('raw','training') DEFAULT 'raw' NOT NULL;--> statement-breakpoint
ALTER TABLE `datasetExports` ADD `filtersJson` text;--> statement-breakpoint
ALTER TABLE `datasetExports` ADD `manifestJson` text;--> statement-breakpoint
ALTER TABLE `datasetExports` ADD `qualitySummaryJson` text;--> statement-breakpoint
ALTER TABLE `datasetSettings` ADD CONSTRAINT `datasetSettings_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshotAnnotations` ADD CONSTRAINT `snapshotAnnotations_snapshotId_snapshots_id_fk` FOREIGN KEY (`snapshotId`) REFERENCES `snapshots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `snapshotAnnotations` ADD CONSTRAINT `snapshotAnnotations_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `snapshot_annotations_status_updated_idx` ON `snapshotAnnotations` (`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `dataset_exports_mode_created_idx` ON `datasetExports` (`exportMode`,`createdAt`);