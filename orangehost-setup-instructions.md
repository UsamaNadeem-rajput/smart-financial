# Quick Setup Instructions for OrangeHost

## 🚀 One-Command Deployment

1. **Prepare your project:**
```bash
chmod +x deploy-orangehost.sh
./deploy-orangehost.sh
```

2. **Update environment variables:**
   - Edit `my-app/.env` with your domain
   - Edit `server/.env` with your database details

3. **Upload to OrangeHost:**
   - Use cPanel File Manager or FTP
   - Upload contents of `orangehost-deploy/` to `public_html/`

4. **Setup Database:**
   - Create MySQL database in cPanel
   - Import `database-schema.sql` via phpMyAdmin
   - Update database credentials in `api/.env`

5. **Test your site:**
   - Visit your domain
   - Register a new user
   - Create a business and test functionality

## 📋 Checklist

- [ ] Domain configured and pointing to OrangeHost
- [ ] Files uploaded to public_html
- [ ] MySQL database created
- [ ] Database schema imported
- [ ] Environment variables configured
- [ ] .htaccess files in place
- [ ] Site tested and working

## 🆘 Need Help?

Check the detailed guide: `orangehost-deployment-guide.md`

## 🔧 Common OrangeHost Settings

- **PHP Version:** 8.1 or higher
- **Node.js:** Enable if available
- **MySQL:** Version 5.7 or higher
- **SSL:** Enable Let's Encrypt SSL
- **File Permissions:** 755 for directories, 644 for files

## 📞 Support

If you encounter issues:
1. Check cPanel error logs
2. Verify file permissions
3. Contact OrangeHost support for server-specific help