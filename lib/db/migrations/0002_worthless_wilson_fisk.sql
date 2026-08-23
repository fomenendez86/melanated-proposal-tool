ALTER TABLE `proposals` ADD `is_template` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `proposals` ADD `template_name` text;--> statement-breakpoint
ALTER TABLE `proposals` ADD `template_description` text;--> statement-breakpoint
ALTER TABLE `proposals` ADD `template_thumbnail_url` text;