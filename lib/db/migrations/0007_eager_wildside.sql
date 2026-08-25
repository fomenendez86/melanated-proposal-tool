CREATE TABLE `itineraries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`destination_label` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `itinerary_day_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`time_range` text,
	`description` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `itinerary_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_day_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `itinerary_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_day_paragraphs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_id` integer NOT NULL,
	`body` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `itinerary_days`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`day_number` integer NOT NULL,
	`date` text,
	`subtitle` text,
	`highlight_line` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_excursions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`tier_id` integer,
	`excursion_id` integer NOT NULL,
	`price_override` real,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `itinerary_tiers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`excursion_id`) REFERENCES `excursions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `itinerary_flights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`tier_id` integer,
	`carrier` text,
	`flight_number` text,
	`origin_airport` text,
	`destination_airport` text,
	`departure_at` integer,
	`arrival_at` integer,
	`cabin_class` text,
	`cost_minor` integer,
	`currency` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `itinerary_tiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_hotels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`tier_id` integer,
	`hotel_id` integer NOT NULL,
	`room_category` text NOT NULL,
	`meal_plan` text NOT NULL,
	`nights` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `itinerary_tiers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `itinerary_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price_minor` integer,
	`currency` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_transport` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`tier_id` integer,
	`mode` text,
	`description` text,
	`vehicle_type` text,
	`pickup_location` text,
	`dropoff_location` text,
	`scheduled_at` integer,
	`cost_minor` integer,
	`currency` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `itinerary_tiers`(`id`) ON UPDATE no action ON DELETE cascade
);
