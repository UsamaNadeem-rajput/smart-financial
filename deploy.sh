#!/bin/bash

# Deployment script for Railway + Hostinger

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "my-app" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd my-app

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from example..."
    cp .env.example .env
    echo "📝 Please update .env with your Railway backend URL"
    echo "   VITE_BACKEND_URL=https://smart-financial-production.up.railway.app"
    read -p "Press enter when you've updated the .env file..."
fi

# Install dependencies and build
npm install
npm run build

echo "✅ Frontend built successfully!"
echo "📁 Upload the contents of my-app/dist/ to your Hostinger public_html folder"

# Go back to root
cd ..

echo "🔧 Backend deployment notes:"
echo "1. Push your code to GitHub/GitLab"
echo "2. Connect Railway to your repository"
echo "3. Set the root directory to 'server'"
echo "4. Configure environment variables in Railway"
echo ""
echo "📋 Environment variables needed in Railway:"
echo "   DB_HOST=your_hostinger_mysql_host"
echo "   DB_PORT=3306"
echo "   DB_USER=your_db_username"
echo "   DB_PASSWORD=your_db_password"
echo "   DB_NAME=your_database_name"
echo "   SESSION_SECRET=your_super_secret_session_key"
echo "   NODE_ENV=production"
echo "   FRONTEND_URL=https://alamsherbaloch.com"
echo ""
echo "🎉 Deployment preparation complete!"
echo "📖 Check deployment-guide.md for detailed instructions"