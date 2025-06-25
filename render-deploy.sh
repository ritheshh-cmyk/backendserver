#!/bin/bash

# Render CLI Deployment Script for Backend
# This script provides the commands to deploy your backend to Render

echo "🚀 Render Backend Deployment Commands"
echo "====================================="
echo ""

echo "1. Install Render CLI (if not already installed):"
echo "   npm install -g @render/cli"
echo ""

echo "2. Login to Render:"
echo "   render login"
echo ""

echo "3. Deploy using render.yaml (if you have payment info set up):"
echo "   render deploy"
echo ""

echo "4. Alternative: Deploy via Render Dashboard"
echo "   - Go to: https://dashboard.render.com"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect GitHub and select: ritheshh-cmyk/backendmobile"
echo "   - Use these settings:"
echo "     * Name: mobile-repair-backend"
echo "     * Environment: Node"
echo "     * Build Command: npm install && npm run build"
echo "     * Start Command: npm run start"
echo "     * Branch: main"
echo ""

echo "5. Environment Variables to add:"
echo "   NODE_ENV=production"
echo "   PORT=10000"
echo ""

echo "6. After deployment, your backend will be available at:"
echo "   https://mobile-repair-backend.onrender.com"
echo ""

echo "📝 Note: Render requires payment information for new services."
echo "   Visit: https://dashboard.render.com/billing to add a payment method." 