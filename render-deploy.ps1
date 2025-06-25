# Render CLI Deployment Script for Backend (PowerShell)
# This script provides the commands to deploy your backend to Render

Write-Host "🚀 Render Backend Deployment Commands" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Install Render CLI (if not already installed):" -ForegroundColor Yellow
Write-Host "   npm install -g @render/cli" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Login to Render:" -ForegroundColor Yellow
Write-Host "   render login" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Deploy using render.yaml (if you have payment info set up):" -ForegroundColor Yellow
Write-Host "   render deploy" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Alternative: Deploy via Render Dashboard" -ForegroundColor Yellow
Write-Host "   - Go to: https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "   - Click 'New +' → 'Web Service'" -ForegroundColor Cyan
Write-Host "   - Connect GitHub and select: ritheshh-cmyk/backendmobile" -ForegroundColor Cyan
Write-Host "   - Use these settings:" -ForegroundColor Cyan
Write-Host "     * Name: mobile-repair-backend" -ForegroundColor White
Write-Host "     * Environment: Node" -ForegroundColor White
Write-Host "     * Build Command: npm install && npm run build" -ForegroundColor White
Write-Host "     * Start Command: npm run start" -ForegroundColor White
Write-Host "     * Branch: main" -ForegroundColor White
Write-Host ""

Write-Host "5. Environment Variables to add:" -ForegroundColor Yellow
Write-Host "   NODE_ENV=production" -ForegroundColor Cyan
Write-Host "   PORT=10000" -ForegroundColor Cyan
Write-Host ""

Write-Host "6. After deployment, your backend will be available at:" -ForegroundColor Yellow
Write-Host "   https://mobile-repair-backend.onrender.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Note: Render requires payment information for new services." -ForegroundColor Red
Write-Host "   Visit: https://dashboard.render.com/billing to add a payment method." -ForegroundColor Red 