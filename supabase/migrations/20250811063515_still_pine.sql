-- Smart Financial Database Schema for OrangeHost MySQL

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create businesses table
CREATE TABLE IF NOT EXISTS `businesses` (
  `business_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `business_name` varchar(100) NOT NULL,
  `business_type` enum('sole','partnership','company') NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `ntn_number` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `plan` enum('free','premium') NOT NULL DEFAULT 'free',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_id`),
  KEY `idx_username` (`username`),
  KEY `idx_business_name` (`business_name`),
  FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create account_types table
CREATE TABLE IF NOT EXISTS `account_types` (
  `type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `parent_type_id` int(11) DEFAULT NULL,
  `is_subtype` tinyint(1) NOT NULL DEFAULT 0,
  `is_heading` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`type_id`),
  KEY `idx_parent_type` (`parent_type_id`),
  FOREIGN KEY (`parent_type_id`) REFERENCES `account_types`(`type_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default account types
INSERT INTO `account_types` (`type_id`, `type_name`, `parent_type_id`, `is_subtype`, `is_heading`) VALUES
(1, 'Income', NULL, 0, 0),
(2, 'Expense', NULL, 0, 0),
(3, 'Assets', NULL, 0, 1),
(4, 'Fixed Assets', 3, 1, 0),
(5, 'Current Assets', 3, 1, 0),
(6, 'Liability', NULL, 0, 1),
(7, 'Current Liability', 6, 1, 0),
(8, 'Non-Current Liabilities', 6, 1, 0),
(9, 'Equity', NULL, 0, 0),
(10, 'Others', NULL, 0, 1),
(11, 'Other Assets', 10, 1, 0),
(12, 'Other Incomes', 10, 1, 0),
(13, 'Other Expenses', 10, 1, 0),
(14, 'Cost Of Goods Sold', 10, 1, 0);

-- Create accounts table
CREATE TABLE IF NOT EXISTS `accounts` (
  `account_id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `account_name` varchar(100) NOT NULL,
  `type_id` int(11) NOT NULL,
  `parent_account_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  KEY `idx_business_id` (`business_id`),
  KEY `idx_type_id` (`type_id`),
  KEY `idx_parent_account` (`parent_account_id`),
  KEY `idx_account_name` (`account_name`),
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`business_id`) ON DELETE CASCADE,
  FOREIGN KEY (`type_id`) REFERENCES `account_types`(`type_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`parent_account_id`) REFERENCES `accounts`(`account_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table
CREATE TABLE IF NOT EXISTS `transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `frontend_transaction_id` int(11) DEFAULT NULL,
  `business_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_business_id` (`business_id`),
  KEY `idx_date` (`date`),
  KEY `idx_frontend_transaction_id` (`frontend_transaction_id`),
  FOREIGN KEY (`business_id`) REFERENCES `businesses`(`business_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transaction_entries table
CREATE TABLE IF NOT EXISTS `transaction_entries` (
  `entry_id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('debit','credit') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_type` (`type`),
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`transaction_id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sessions table for express-session
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires`);

-- Add some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample user (password is 'password123')
INSERT IGNORE INTO `users` (`username`, `full_name`, `email`, `password_hash`) VALUES
('testuser', 'Test User', 'test@example.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQj');

-- Sample business
INSERT IGNORE INTO `businesses` (`username`, `business_name`, `business_type`, `plan`) VALUES
('testuser', 'Sample Business', 'company', 'free');