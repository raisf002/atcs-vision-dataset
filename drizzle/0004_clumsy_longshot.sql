CREATE TABLE `cameraCountingConfigs` (
	`cameraId` varchar(96) NOT NULL,
	`modelId` varchar(64),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`confidenceThreshold` int NOT NULL DEFAULT 35,
	`virtualLinesJson` text NOT NULL,
	`classFilterJson` text NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cameraCountingConfigs_cameraId` PRIMARY KEY(`cameraId`)
);
--> statement-breakpoint
CREATE TABLE `visionModels` (
	`id` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`framework` enum('yolo','onnx','tensorrt','other') NOT NULL,
	`format` enum('pt','onnx','engine','tflite','other') NOT NULL,
	`version` varchar(80),
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(512) NOT NULL,
	`sizeBytes` bigint NOT NULL DEFAULT 0,
	`labelsJson` text NOT NULL,
	`description` text,
	`status` enum('draft','ready','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visionModels_id` PRIMARY KEY(`id`),
	CONSTRAINT `visionModels_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
ALTER TABLE `cameraCountingConfigs` ADD CONSTRAINT `cameraCountingConfigs_cameraId_cameras_id_fk` FOREIGN KEY (`cameraId`) REFERENCES `cameras`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cameraCountingConfigs` ADD CONSTRAINT `cameraCountingConfigs_modelId_visionModels_id_fk` FOREIGN KEY (`modelId`) REFERENCES `visionModels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cameraCountingConfigs` ADD CONSTRAINT `cameraCountingConfigs_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visionModels` ADD CONSTRAINT `visionModels_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `camera_counting_model_idx` ON `cameraCountingConfigs` (`modelId`);--> statement-breakpoint
CREATE INDEX `vision_models_status_created_idx` ON `visionModels` (`status`,`createdAt`);