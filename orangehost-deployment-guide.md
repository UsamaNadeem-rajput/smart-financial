# OrangeHost Deployment Guide

## Prerequisites
- OrangeHost hosting account with cPanel access
- Domain name configured
- MySQL database access

## Step 1: Prepare Your Project

1. Run the deployment script:
```bash
chmod +x deploy-orangehost.sh
./deploy-orangehost.sh
```

2. Update the frontend environment variables in `my-app/.env`:
```
VITE_BACKEND_URL=https://yourdomain.com/api
```

## Step 2: Database Setup

### Create MySQL Database
1. Login to cPanel
2. Go to "MySQL Databases"
3. Create a new database (e.g., `yourusername_smartfinancial`)
4. Create a database user with full privileges
5. Note down the database details:
   - Host: usually `localhost`
   - Database name: `yourusername_smartfinancial`
   - Username: `yourusername_dbuser`
   - Password: (your chosen password)

### Import Database Schema
1. Go to phpMyAdmin in cPanel
2. Select your database
3. Import the `database-schema.sql` file
4. Verify all tables are created

## Step 3: Upload Files

### Option A: Using cPanel File Manager
1. Login to cPanel
2. Open File Manager
3. Navigate to `public_html`
4. Upload and extract the `orangehost-deploy.zip` file
5. Ensure files are in the root of `public_html`

### Option B: Using FTP
1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect using your cPanel credentials
3. Upload all files from `orangehost-deploy/` to `public_html/`

## Step 4: Configure Backend

1. In cPanel File Manager, navigate to `public_html/api/`
2. Create/edit `.env` file with your database details:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=yourusername_dbuser
DB_PASSWORD=your_database_password
DB_NAME=yourusername_smartfinancial
SESSION_SECRET=your_super_secret_session_key_here
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Step 5: Install Dependencies

### If Node.js is available:
1. SSH into your server (if available)
2. Navigate to the `api` directory
3. Run: `npm install --production`

### If Node.js is not available:
- Contact OrangeHost support to enable Node.js
- Or use the PHP version (see php-backend/ directory)

## Step 6: Configure URL Rewriting

The `.htaccess` files are already configured for:
- Frontend routing (React Router)
- API routing
- Security headers
- Compression

## Step 7: Test Your Deployment

1. Visit your domain: `https://yourdomain.com`
2. Test user registration and login
3. Create a business and test functionality
4. Check browser console for any errors

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check file permissions (755 for directories, 644 for files)
   - Verify .htaccess syntax
   - Check error logs in cPanel

2. **Database Connection Failed**
   - Verify database credentials in .env
   - Ensure database user has proper privileges
   - Check if database host is correct

3. **API Endpoints Not Working**
   - Verify .htaccess in api directory
   - Check if mod_rewrite is enabled
   - Ensure Node.js is properly configured

4. **Frontend Not Loading**
   - Check if all files uploaded correctly
   - Verify .htaccess in root directory
   - Check browser console for errors

### Getting Help:
- Check cPanel error logs
- Contact OrangeHost support for server-specific issues
- Verify all environment variables are set correctly

## Security Notes:
- Change default session secret
- Use strong database passwords
- Keep your application updated
- Regular database backups

## Performance Optimization:
- Enable gzip compression (already configured)
- Use CDN for static assets
- Optimize images
- Enable browser caching