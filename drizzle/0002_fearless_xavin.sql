CREATE TABLE `finance_ai_usage` (
	`scope` text NOT NULL,
	`day` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`scope`, `day`)
);
