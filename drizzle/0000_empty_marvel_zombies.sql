CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`image_key` text NOT NULL,
	`link` text,
	`position` integer NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `match_events` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`player_id` text NOT NULL,
	`type` text NOT NULL,
	`minute` integer NOT NULL,
	`detail` text
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`phase` text NOT NULL,
	`round` integer NOT NULL,
	`home_id` text NOT NULL,
	`away_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`venue` text,
	`scorer_id` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`document` text NOT NULL,
	`number` integer,
	`position` text,
	`photo_key` text,
	`approved` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_team_document` ON `players` (`team_id`,`document`);--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ratings_player_user` ON `ratings` (`player_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`coach_id` text,
	`name` text NOT NULL,
	`crest_key` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`format` text NOT NULL,
	`teams_limit` integer NOT NULL,
	`qualifiers` integer NOT NULL,
	`next_phase` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tournaments_slug` ON `tournaments` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);