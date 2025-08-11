#!/bin/bash

# VPS Deployment Script
# Run this script on your VPS server

echo "🚀 Deploying Laravel Application..."

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from your project root directory"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x *.sh

# Deploy with Docker
echo "🐳 Deploying with Docker..."
./quick-deploy.sh

echo "✅ Deployment completed!"
echo ""
echo "🔍 Next steps to verify:"
echo "1. Check container status: docker-compose ps"
echo "2. Check logs: docker-compose logs app"
echo "3. Test the application in browser"
echo "4. Monitor for 502 errors"
