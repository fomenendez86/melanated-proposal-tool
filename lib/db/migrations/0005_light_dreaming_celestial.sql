CREATE TABLE `proposal_emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer,
	`kind` text NOT NULL,
	`recipients` text NOT NULL,
	`subject` text NOT NULL,
	`provider` text NOT NULL,
	`provider_message_id` text,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `proposal_signatures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer NOT NULL,
	`revision_id` integer NOT NULL,
	`signer_name` text NOT NULL,
	`signer_email` text,
	`signer_role` text NOT NULL,
	`signature_type` text NOT NULL,
	`signature_data` text NOT NULL,
	`ip_address_truncated` text,
	`user_agent` text,
	`payload_hash` text NOT NULL,
	`signed_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`revision_id`) REFERENCES `proposal_revisions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
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
	CONSTRAINT "proposal_events_type_check" CHECK("__new_proposal_events"."type" in ('shared', 'sent', 'reminder', 'opened', 'approved', 'signed', 'lost', 'reopened', 'pricing_selected', 'pdf_generated', 'pdf_downloaded', 'pdf_failed'))
);
--> statement-breakpoint
INSERT INTO `__new_proposal_events`("id", "proposal_id", "share_id", "type", "metadata", "created_at") SELECT "id", "proposal_id", "share_id", "type", "metadata", "created_at" FROM `proposal_events`;--> statement-breakpoint
DROP TABLE `proposal_events`;--> statement-breakpoint
ALTER TABLE `__new_proposal_events` RENAME TO `proposal_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `proposals` ADD `pipeline_stage` text;--> statement-breakpoint
ALTER TABLE `proposals` ADD `lost_reason` text;--> statement-breakpoint
ALTER TABLE `proposals` ADD `closed_value_minor` integer;--> statement-breakpoint
ALTER TABLE `proposals` ADD `closed_currency` text;--> statement-breakpoint
ALTER TABLE `proposal_revisions` ADD `sealed_at` integer;--> statement-breakpoint
PRAGMA foreign_keys=ON;
