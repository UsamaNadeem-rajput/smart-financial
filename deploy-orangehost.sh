#!/bin/bash

# OrangeHost Deployment Script
echo "🚀 Starting OrangeHost deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "my-app" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p orangehost-deploy
cd orangehost-deploy

# Build frontend
echo "📦 Building frontend..."
cd ../my-app

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from example..."
    cp .env.example .env
    echo "📝 Please update .env with your OrangeHost backend URL"
    echo "   VITE_BACKEND_URL=https://yourdomain.com/api"
    read -p "Press enter when you've updated the .env file..."
fi

# Install dependencies and build
npm install
npm run build

# Copy built files to deployment directory
echo "📋 Copying frontend files..."
cp -r dist/* ../orangehost-deploy/

# Copy backend files
echo "📋 Copying backend files..."
cd ../server
cp -r * ../orangehost-deploy/api/
mkdir -p ../orangehost-deploy/api

# Create necessary directories and files for OrangeHost
cd ../orangehost-deploy

echo "✅ Deployment files prepared!"
echo "📁 Upload the contents of orangehost-deploy/ to your OrangeHost public_html folder"
echo ""
echo "🔧 Next steps:"
echo "1. Upload files via cPanel File Manager or FTP"
echo "2. Create MySQL database in cPanel"
echo "3. Import database schema (see database-schema.sql)"
echo "4. Update API configuration with your database details"
echo ""
echo "📖 Check orangehost-deployment-guide.md for detailed instructions"