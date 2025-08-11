#!/bin/bash

# OrangeHost Complete Deployment Script
echo "🚀 Starting OrangeHost deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "my-app" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
rm -rf orangehost-deploy
mkdir -p orangehost-deploy

# Build frontend
echo "📦 Building frontend..."
cd my-app

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from example..."
    cp .env.example .env
    echo "📝 Please update .env with your OrangeHost domain"
    echo "   VITE_BACKEND_URL=https://yourdomain.com/api"
    read -p "Press enter when you've updated the .env file..."
fi

# Install dependencies and build
npm install
npm run build

# Copy built files to deployment directory
echo "📋 Copying frontend files..."
cp -r dist/* ../orangehost-deploy/
cp .htaccess ../orangehost-deploy/ 2>/dev/null || echo "No .htaccess found in frontend"

# Copy backend files
echo "📋 Copying backend files..."
cd ../server
mkdir -p ../orangehost-deploy/api

# Copy all server files except node_modules and .env
cp -r !(node_modules|.env) ../orangehost-deploy/api/ 2>/dev/null || {
    # Fallback for systems without extended globbing
    cp *.js ../orangehost-deploy/api/
    cp *.json ../orangehost-deploy/api/
    cp -r routers ../orangehost-deploy/api/
    cp .htaccess ../orangehost-deploy/api/ 2>/dev/null || echo "No .htaccess found in server"
}

# Copy environment template
cp .env.production ../orangehost-deploy/api/.env.example

# Go back to root and create final structure
cd ..

# Create database schema file
echo "📋 Creating database schema..."
cat > orangehost-deploy/database-schema.sql << 'EOF'
-- Smart Financial Database Schema for OrangeHost MySQL
-- Run this in phpMyAdmin after creating your database

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
EOF

# Create deployment instructions
cat > orangehost-deploy/DEPLOYMENT-INSTRUCTIONS.txt << 'EOF'
🚀 ORANGEHOST DEPLOYMENT INSTRUCTIONS

1. UPLOAD FILES:
   - Upload ALL files from this folder to your public_html directory
   - Make sure the 'api' folder is inside public_html

2. CREATE DATABASE:
   - Go to cPanel > MySQL Databases
   - Create a new database (e.g., yourusername_smartfinancial)
   - Create a database user with full privileges
   - Note down: host, database name, username, password

3. IMPORT DATABASE SCHEMA:
   - Go to cPanel > phpMyAdmin
   - Select your database
   - Import the 'database-schema.sql' file

4. CONFIGURE BACKEND:
   - Go to public_html/api/
   - Rename .env.example to .env
   - Edit .env with your database details:
     DB_HOST=localhost
     DB_USER=yourusername_dbuser
     DB_PASSWORD=your_password
     DB_NAME=yourusername_smartfinancial
     FRONTEND_URL=https://yourdomain.com

5. ENABLE NODE.JS (if available):
   - Contact OrangeHost support to enable Node.js
   - Or use the PHP fallback (contact support for setup)

6. TEST YOUR SITE:
   - Visit https://yourdomain.com
   - Register a new user
   - Create a business and test functionality

For detailed instructions, see: orangehost-deployment-guide.md
EOF

# Create comprehensive deployment guide
cat > orangehost-deploy/orangehost-deployment-guide.md << 'EOF'
# Complete OrangeHost Deployment Guide

## 🎯 Overview
This guide will help you deploy your Smart Financial application on OrangeHost with everything on the same domain.

## 📋 Prerequisites
- OrangeHost hosting account with cPanel access
- Domain name configured and pointing to OrangeHost
- MySQL database access (included with most OrangeHost plans)

## 🚀 Step-by-Step Deployment

### Step 1: Upload Files to OrangeHost

#### Option A: Using cPanel File Manager (Recommended)
1. Login to your OrangeHost cPanel
2. Open "File Manager"
3. Navigate to `public_html` directory
4. Upload all files from the `orangehost-deploy` folder
5. Extract if you uploaded as a zip file
6. Ensure the folder structure looks like:
   ```
   public_html/
   ├── index.html (your React app)
   ├── assets/ (CSS, JS files)
   ├── api/ (backend files)
   ├── database-schema.sql
   └── .htaccess
   ```

#### Option B: Using FTP
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect using your cPanel credentials
3. Navigate to `public_html`
4. Upload all files from `orangehost-deploy` folder

### Step 2: Create MySQL Database

1. In cPanel, go to "MySQL Databases"
2. Create a new database:
   - Database Name: `yourusername_smartfinancial` (replace yourusername)
3. Create a database user:
   - Username: `yourusername_dbuser`
   - Password: Choose a strong password
4. Add user to database with "All Privileges"
5. Note down these details:
   - Host: `localhost`
   - Database: `yourusername_smartfinancial`
   - Username: `yourusername_dbuser`
   - Password: Your chosen password

### Step 3: Import Database Schema

1. In cPanel, go to "phpMyAdmin"
2. Select your database from the left sidebar
3. Click "Import" tab
4. Choose file: `database-schema.sql`
5. Click "Go" to import
6. Verify all tables are created (users, businesses, accounts, etc.)

### Step 4: Configure Backend Environment

1. In File Manager, navigate to `public_html/api/`
2. Find `.env.example` file
3. Rename it to `.env`
4. Edit the `.env` file with your database details:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=yourusername_dbuser
   DB_PASSWORD=your_database_password
   DB_NAME=yourusername_smartfinancial
   SESSION_SECRET=change_this_to_a_random_string_in_production
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   ```

### Step 5: Enable Node.js (If Available)

#### If OrangeHost supports Node.js:
1. Contact OrangeHost support to enable Node.js for your account
2. In cPanel, look for "Node.js" or "Node.js Selector"
3. Set Node.js version to 16+ or latest LTS
4. Set startup file to `api/server.js`
5. Install dependencies by running: `npm install` in the api directory

#### If Node.js is not available:
- The application includes fallback PHP scripts
- Contact OrangeHost support for PHP configuration assistance

### Step 6: Set File Permissions

Set proper permissions for security:
- Directories: 755
- Files: 644
- .htaccess files: 644

### Step 7: Test Your Application

1. Visit your domain: `https://yourdomain.com`
2. You should see the Smart Financial landing page
3. Test user registration:
   - Click "Get Started" or "Sign Up"
   - Create a new account
   - Verify you can login
4. Test business creation:
   - Create a new business
   - Add accounts/ledgers
   - Post transactions
5. Check all functionality works

## 🔧 Troubleshooting

### Common Issues:

#### 1. 500 Internal Server Error
- Check file permissions (755 for directories, 644 for files)
- Verify .htaccess syntax
- Check cPanel Error Logs

#### 2. Database Connection Failed
- Verify database credentials in .env file
- Ensure database user has proper privileges
- Check if database host is correct (usually localhost)

#### 3. API Endpoints Not Working
- Verify .htaccess file is in the api directory
- Check if mod_rewrite is enabled (contact support)
- Ensure Node.js is properly configured

#### 4. Frontend Not Loading
- Check if all files uploaded correctly
- Verify .htaccess in root directory
- Check browser console for errors

#### 5. CORS Errors
- Update FRONTEND_URL in .env to match your domain
- Ensure HTTPS is properly configured

### Getting Help:
- Check cPanel Error Logs (cPanel > Error Logs)
- Contact OrangeHost support for server-specific issues
- Verify all environment variables are set correctly

## 🔒 Security Checklist

- [ ] Change default session secret in .env
- [ ] Use strong database passwords
- [ ] Enable SSL certificate (Let's Encrypt available in cPanel)
- [ ] Verify .htaccess files are protecting sensitive files
- [ ] Regular database backups

## 🚀 Performance Optimization

- [ ] Enable gzip compression (configured in .htaccess)
- [ ] Use CDN for static assets (optional)
- [ ] Optimize images
- [ ] Enable browser caching (configured in .htaccess)

## 📞 Support

If you encounter issues:
1. Check cPanel error logs first
2. Verify all configuration files
3. Contact OrangeHost support for server-specific help
4. Ensure all environment variables are correctly set

Your Smart Financial application should now be fully deployed and running on OrangeHost! 🎉
EOF

echo "✅ Deployment files prepared successfully!"
echo ""
echo "📁 Files created in: orangehost-deploy/"
echo "📋 Next steps:"
echo "1. Upload contents of orangehost-deploy/ to your public_html folder"
echo "2. Create MySQL database in cPanel"
echo "3. Import database-schema.sql"
echo "4. Configure .env file in api/ directory"
echo "5. Test your site!"
echo ""
echo "📖 See DEPLOYMENT-INSTRUCTIONS.txt and orangehost-deployment-guide.md for detailed steps"