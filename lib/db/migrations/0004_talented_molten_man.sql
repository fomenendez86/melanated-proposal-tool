CREATE TABLE `proposal_pricing_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`proposal_id` integer NOT NULL,
	`description` text NOT NULL,
	`quantity_milli` integer DEFAULT 1000 NOT NULL,
	`unit_price_minor` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`unit` text DEFAULT 'flat' NOT NULL,
	`tax_rate_bps` integer DEFAULT 0 NOT NULL,
	`discount_type` text DEFAULT 'none' NOT NULL,
	`discount_value` integer DEFAULT 0 NOT NULL,
	`optional` integer DEFAULT false NOT NULL,
	`selected_by_default` integer DEFAULT true NOT NULL,
	`quantity_editable` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "proposal_pricing_items_quantity_check" CHECK("proposal_pricing_items"."quantity_milli" >= 1),
	CONSTRAINT "proposal_pricing_items_price_check" CHECK("proposal_pricing_items"."unit_price_minor" >= 0),
	CONSTRAINT "proposal_pricing_items_tax_check" CHECK("proposal_pricing_items"."tax_rate_bps" >= 0 and "proposal_pricing_items"."tax_rate_bps" <= 10000),
	CONSTRAINT "proposal_pricing_items_unit_check" CHECK("proposal_pricing_items"."unit" in ('flat', 'per_person', 'per_night', 'per_vehicle')),
	CONSTRAINT "proposal_pricing_items_discount_type_check" CHECK("proposal_pricing_items"."discount_type" in ('none', 'amount', 'percent'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proposal_pricing_items_public_id_unique` ON `proposal_pricing_items` (`public_id`);--> statement-breakpoint
INSERT INTO `proposal_pricing_items` (`public_id`, `proposal_id`, `description`, `quantity_milli`, `unit_price_minor`, `currency`, `unit`, `tax_rate_bps`, `discount_type`, `discount_value`, `optional`, `selected_by_default`, `quantity_editable`, `sort_order`, `created_at`, `updated_at`)
SELECT 'legacy-' || `proposal_id`, `proposal_id`, 'Package total', 1000, CAST(ROUND(`invoice_total` * 100) AS integer), `currency`, 'flat', 0,
  CASE WHEN `commission` > 0 THEN 'amount' ELSE 'none' END,
  CAST(ROUND(`commission` * 100) AS integer), false, true, false, 0, unixepoch(), unixepoch()
FROM `proposal_pricing`;--> statement-breakpoint
CREATE TABLE `proposal_share_pricing_selections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`share_id` integer NOT NULL,
	`item_public_id` text NOT NULL,
	`selected` integer NOT NULL,
	`quantity_milli` integer NOT NULL,
	`frozen_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`share_id`) REFERENCES `proposal_shares`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "share_pricing_quantity_check" CHECK("proposal_share_pricing_selections"."quantity_milli" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_pricing_item_unique` ON `proposal_share_pricing_selections` (`share_id`,`item_public_id`);--> statement-breakpoint
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
	CONSTRAINT "proposal_events_type_check" CHECK("__new_proposal_events"."type" in ('shared', 'opened', 'approved', 'pricing_selected', 'pdf_generated', 'pdf_failed'))
);
--> statement-breakpoint
INSERT INTO `__new_proposal_events`("id", "proposal_id", "share_id", "type", "metadata", "created_at") SELECT "id", "proposal_id", "share_id", "type", "metadata", "created_at" FROM `proposal_events`;--> statement-breakpoint
DROP TABLE `proposal_events`;--> statement-breakpoint
ALTER TABLE `__new_proposal_events` RENAME TO `proposal_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `proposal_payment_schedule` ADD `amount_type` text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposal_payment_schedule` ADD `amount_minor` integer;--> statement-breakpoint
ALTER TABLE `proposal_payment_schedule` ADD `percentage_bps` integer;--> statement-breakpoint
ALTER TABLE `proposal_revisions` ADD `raw_data` text;
