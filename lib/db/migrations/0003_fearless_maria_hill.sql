CREATE TABLE `library_fees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit_price_minor` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`unit` text DEFAULT 'flat' NOT NULL,
	`tax_rate_bps` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "library_fees_unit_check" CHECK("library_fees"."unit" in ('flat', 'per_person', 'per_night', 'per_vehicle')),
	CONSTRAINT "library_fees_price_check" CHECK("library_fees"."unit_price_minor" >= 0),
	CONSTRAINT "library_fees_tax_check" CHECK("library_fees"."tax_rate_bps" >= 0 and "library_fees"."tax_rate_bps" <= 10000)
);
--> statement-breakpoint
CREATE TABLE `library_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`original_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`tags` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_images_storage_key_unique` ON `library_images` (`storage_key`);--> statement-breakpoint
CREATE TABLE `library_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`section_type` text NOT NULL,
	`payload` text NOT NULL,
	`variant_id` text,
	`tags` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `library_snippets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`tags` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
