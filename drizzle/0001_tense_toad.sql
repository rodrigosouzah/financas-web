CREATE TABLE `finance_native_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
