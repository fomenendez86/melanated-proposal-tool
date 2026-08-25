CREATE TABLE `proposal_comment_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer NOT NULL,
	`revision_id` integer NOT NULL,
	`section_key` text NOT NULL,
	`source_section_id` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`orphaned` integer DEFAULT false NOT NULL,
	`client_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revision_id`) REFERENCES `proposal_revisions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `proposal_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL,
	`author_type` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `proposal_comment_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposal_internal_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`section_key` text NOT NULL,
	`source_section_id` integer,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposal_notification_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`recipient_email` text,
	`first_open_enabled` integer DEFAULT true NOT NULL,
	`signature_enabled` integer DEFAULT true NOT NULL,
	`expiry_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_notification_settings_proposal_id_unique` ON `proposal_notification_settings` (`proposal_id`);--> statement-breakpoint
CREATE TABLE `proposal_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`read_at` integer,
	`emailed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_notifications_dedupe_key_unique` ON `proposal_notifications` (`dedupe_key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_proposal_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer,
	`type` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "proposal_events_type_check" CHECK("__new_proposal_events"."type" in ('shared', 'sent', 'reminder', 'opened', 'approved', 'signed', 'lost', 'reopened', 'pricing_selected', 'engagement', 'comment_added', 'comment_replied', 'comment_resolved', 'notification_sent', 'pdf_generated', 'pdf_downloaded', 'pdf_failed'))
);
--> statement-breakpoint
INSERT INTO `__new_proposal_events`("id", "proposal_id", "share_id", "type", "metadata", "created_at") SELECT "id", "proposal_id", "share_id", "type", "metadata", "created_at" FROM `proposal_events`;--> statement-breakpoint
DROP TABLE `proposal_events`;--> statement-breakpoint
ALTER TABLE `__new_proposal_events` RENAME TO `proposal_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;