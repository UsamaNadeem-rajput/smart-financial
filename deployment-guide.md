# Deployment Guide: Railway (Backend) + Hostinger (Frontend + Database)

## Prerequisites
- Railway account (https://railway.app)
- Hostinger account with hosting plan
- Git repository (GitHub/GitLab)

## Part 1: Database Setup on Hostinger

### Step 1: Create MySQL Database
1. Log into your Hostinger control panel (hPanel)
2. Go to **Databases** → **MySQL Databases**
3. Click **Create Database**
4. Fill in:
   - Database name: `finance_app_db`
   - Username: `finance_user`
   - Password: (generate strong password)
5. Note down the database credentials

### Step 2: Create Database Tables
1. Go to **phpMyAdmin** from hPanel
2. Select your database
3. Run the following SQL to create tables:

```sql
-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account types table
CREATE TABLE account_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    parent_type_id INT,
    is_subtype BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (parent_type_id) REFERENCES account_types(type_id)
);

-- Businesses table
CREATE TABLE businesses (
    business_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    business_type ENUM('sole', 'partnership', 'company') NOT NULL,
    industry VARCHAR(50),
    ntn_number VARCHAR(50),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    phone VARCHAR(20),
    plan ENUM('free', 'premium') DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
);

-- Accounts table
CREATE TABLE accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    type_id INT NOT NULL,
    parent_account_id INT,
    description TEXT,
    balance DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(business_id),
    FOREIGN KEY (type_id) REFERENCES account_types(type_id),
    FOREIGN KEY (parent_account_id) REFERENCES accounts(account_id)
);

-- Transactions table
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    description TEXT,
    debit DECIMAL(15,2) NOT NULL,
    credit DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

-- Transaction entries table
CREATE TABLE transaction_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    account_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('debit', 'credit') NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

-- Sessions table for express-session
CREATE TABLE sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
);

-- Insert default account types
INSERT INTO account_types (type_name, parent_type_id, is_subtype) VALUES
('Income', NULL, FALSE),
('Expense', NULL, FALSE),
('Assets', NULL, FALSE),
('Fixed Assets', 3, TRUE),
('Current Assets', 3, TRUE),
('Liability', NULL, FALSE),
('Current Liability', 6, TRUE),
('Non-Current Liabilities', 6, TRUE),
('Equity', NULL, FALSE),
('Others', NULL, FALSE),
('Other Assets', 10, TRUE),
('Other Incomes', 10, TRUE),
('Other Expenses', 10, TRUE),
('Cost Of Goods Sold', 10, TRUE);
```

## Part 2: Backend Deployment on Railway

### Step 1: Prepare Repository
1. Push your code to GitHub/GitLab
2. Make sure your `server` folder contains all backend files

### Step 2: Deploy to Railway
1. Go to https://railway.app and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Configure Environment Variables
1. In Railway dashboard, go to your project
2. Click **Variables** tab
3. Add the following environment variables:

```
DB_HOST=your_hostinger_mysql_host
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
SESSION_SECRET=your_super_secret_session_key_here
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
PORT=8080
```

### Step 4: Configure Build Settings
1. In Railway, go to **Settings** → **Build**
2. Set **Root Directory** to `server`
3. Set **Build Command** to `npm install`
4. Set **Start Command** to `npm start`

### Step 5: Get Railway URL
1. After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`
2. Note this URL for frontend configuration

## Part 3: Frontend Deployment on Hostinger

### Step 1: Build the Frontend
1. In your local `my-app` folder, create `.env` file:
```
VITE_BACKEND_URL=https://your-railway-app.railway.app
```

2. Build the project:
```bash
cd my-app
npm install
npm run build
```

### Step 2: Upload to Hostinger
1. Log into Hostinger hPanel
2. Go to **File Manager**
3. Navigate to `public_html` folder
4. Delete default files (index.html, etc.)
5. Upload all files from `my-app/dist` folder to `public_html`

### Step 3: Configure Domain (if using custom domain)
1. In hPanel, go to **Domains**
2. Point your domain to the hosting account
3. Update DNS settings if needed

## Part 4: Final Configuration

### Step 1: Update CORS in Backend
1. In Railway dashboard, update `FRONTEND_URL` variable with your actual domain
2. Redeploy if necessary

### Step 2: Test the Application
1. Visit your Hostinger domain
2. Test registration, login, and all features
3. Check browser console for any CORS or API errors

### Step 3: SSL Certificate
1. Hostinger usually provides free SSL certificates
2. Enable SSL in hPanel → **SSL/TLS**
3. Force HTTPS redirects

## Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Check FRONTEND_URL in Railway environment variables
   - Ensure domain matches exactly

2. **Database Connection Issues**:
   - Verify database credentials in Railway
   - Check if Hostinger allows external connections

3. **Build Failures**:
   - Check Railway build logs
   - Ensure all dependencies are in package.json

4. **Session Issues**:
   - Verify SESSION_SECRET is set
   - Check cookie settings for cross-domain

### Monitoring:
- Railway provides logs and metrics
- Hostinger provides basic hosting statistics
- Monitor both for performance and errors

## Security Checklist:
- [ ] Strong database passwords
- [ ] Secure session secret
- [ ] HTTPS enabled
- [ ] Environment variables properly set
- [ ] Database access restricted
- [ ] Regular backups configured

## Maintenance:
- Regular database backups
- Monitor Railway usage and costs
- Keep dependencies updated
- Monitor application logs