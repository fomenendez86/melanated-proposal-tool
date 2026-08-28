CREATE TABLE `excursion_provider_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`excursion_id` integer NOT NULL,
	`provider_product_id` text NOT NULL,
	`provider_product_code` text,
	`slug` text,
	`active` integer DEFAULT true NOT NULL,
	`provider_modified_at` text,
	`synced_at` integer NOT NULL,
	`excerpt` text,
	`duration_text` text,
	`duration_minutes` integer,
	`booking_type` text,
	`capacity_type` text,
	`meeting_type` text,
	`min_age` integer,
	`difficulty_level` text,
	`private_activity` integer DEFAULT false NOT NULL,
	`pickup_available` integer DEFAULT false NOT NULL,
	`custom_pickup_allowed` integer DEFAULT false NOT NULL,
	`dropoff_available` integer DEFAULT false NOT NULL,
	`custom_dropoff_allowed` integer DEFAULT false NOT NULL,
	`booking_cutoff_minutes` integer,
	`request_deadline_minutes` integer,
	`requirements` text,
	`attention` text,
	`included` text,
	`excluded` text,
	`main_contact_fields` text NOT NULL,
	`passenger_fields` text NOT NULL,
	`booking_questions` text NOT NULL,
	`pricing_categories` text NOT NULL,
	`rates` text NOT NULL,
	`pickup_places` text NOT NULL,
	`dropoff_places` text NOT NULL,
	`start_times` text NOT NULL,
	`extras` text NOT NULL,
	FOREIGN KEY (`excursion_id`) REFERENCES `excursions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `excursion_provider_data_excursion_unique` ON `excursion_provider_data` (`excursion_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `excursion_provider_data_product_unique` ON `excursion_provider_data` (`provider_product_id`);--> statement-breakpoint
ALTER TABLE `excursion_images` ADD `alt_text` text;--> statement-breakpoint
ALTER TABLE `excursion_images` ADD `provider_photo_id` text;--> statement-breakpoint
ALTER TABLE `excursions` ADD `currency` text DEFAULT 'USD' NOT NULL;