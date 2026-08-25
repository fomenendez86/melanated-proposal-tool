CREATE TABLE `proposal_flights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
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
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposal_transport` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposal_id` integer NOT NULL,
	`mode` text,
	`description` text,
	`vehicle_type` text,
	`pickup_location` text,
	`dropoff_location` text,
	`scheduled_at` integer,
	`cost_minor` integer,
	`currency` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
