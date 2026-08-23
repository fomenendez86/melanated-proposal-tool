CREATE TABLE `proposal_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`share_id` integer,
	`type` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "proposal_events_type_check" CHECK("proposal_events"."type" in ('shared', 'opened', 'approved', 'pdf_generated', 'pdf_failed'))
);
--> statement-breakpoint
CREATE TABLE `proposal_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`design_id` text NOT NULL,
	`design_version` integer NOT NULL,
	`data` text NOT NULL,
	`design` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposal_shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`revision_id` integer NOT NULL,
	`token` text NOT NULL,
	`password_salt` text,
	`password_hash` text,
	`access_key` text,
	`expires_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revision_id`) REFERENCES `proposal_revisions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_shares_token_unique` ON `proposal_shares` (`token`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_proposals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_number` text NOT NULL,
	`lead_client_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`design_id` text,
	`design_version` integer,
	`package_name` text,
	`selected_tier` text,
	`special_occasion` text,
	`arrival_airport` text,
	`departure_airport` text,
	`terms_template_id` integer,
	`cover_title` text DEFAULT 'Proposal' NOT NULL,
	`cover_subtitle` text,
	`cover_image_url` text,
	`travel_dates_label` text,
	`package_total_label` text,
	`passenger_manifest_label` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "proposals_status_check" CHECK("__new_proposals"."status" in ('draft', 'sent', 'viewed', 'approved', 'lost', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_proposals`("id", "proposal_number", "lead_client_id", "status", "design_id", "design_version", "package_name", "selected_tier", "special_occasion", "arrival_airport", "departure_airport", "terms_template_id", "cover_title", "cover_subtitle", "cover_image_url", "travel_dates_label", "package_total_label", "passenger_manifest_label", "created_at", "updated_at") SELECT "id", "proposal_number", "lead_client_id", "status", NULL, NULL, "package_name", "selected_tier", "special_occasion", "arrival_airport", "departure_airport", "terms_template_id", "cover_title", "cover_subtitle", "cover_image_url", "travel_dates_label", "package_total_label", "passenger_manifest_label", "created_at", "updated_at" FROM `proposals`;--> statement-breakpoint
DROP TABLE `proposals`;--> statement-breakpoint
ALTER TABLE `__new_proposals` RENAME TO `proposals`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `proposals_proposal_number_unique` ON `proposals` (`proposal_number`);