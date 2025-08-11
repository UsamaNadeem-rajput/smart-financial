# 🚀 Quick OrangeHost Setup Guide

## One-Command Deployment

```bash
chmod +x deploy-orangehost.sh
./deploy-orangehost.sh
```

## 📋 5-Minute Setup Checklist

### 1. **Upload Files** (2 minutes)
- [ ] Upload `orangehost-deploy/` contents to `public_html/`
- [ ] Verify folder structure: `public_html/api/` exists

### 2. **Database Setup** (2 minutes)
- [ ] cPanel → MySQL Databases → Create database
- [ ] Create database user with full privileges
- [ ] phpMyAdmin → Import `database-schema.sql`

### 3. **Configure Environment** (1 minute)
- [ ] Edit `public_html/api/.env` with database details:
  ```
  DB_HOST=localhost
  DB_USER=yourusername_dbuser
  DB_PASSWORD=your_password
  DB_NAME=yourusername_smartfinancial
  FRONTEND_URL=https://yourdomain.com
  ```

### 4. **Test Application**
- [ ] Visit `https://yourdomain.com`
- [ ] Register new user
- [ ] Create business
- [ ] Test functionality

## 🔧 OrangeHost Specific Settings

- **PHP Version**: 8.1+
- **Node.js**: Contact support to enable
- **SSL**: Enable Let's Encrypt in cPanel
- **File Permissions**: 755 (directories), 644 (files)

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| 500 Error | Check file permissions & .htaccess |
| DB Connection Failed | Verify credentials in .env |
| API Not Working | Contact support for Node.js setup |
| CORS Errors | Update FRONTEND_URL in .env |

## 📞 Need Help?

1. Check cPanel Error Logs
2. See detailed guide: `orangehost-deployment-guide.md`
3. Contact OrangeHost support for server issues

**Your Smart Financial app will be live in 5 minutes!** 🎉