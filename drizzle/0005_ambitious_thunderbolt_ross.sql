ALTER TABLE `visionModels` ADD `scope` enum('global','camera') DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE `visionModels` ADD `cameraId` varchar(96);--> statement-breakpoint
ALTER TABLE `visionModels` ADD CONSTRAINT `visionModels_cameraId_cameras_id_fk` FOREIGN KEY (`cameraId`) REFERENCES `cameras`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `vision_models_scope_camera_idx` ON `visionModels` (`scope`,`cameraId`);