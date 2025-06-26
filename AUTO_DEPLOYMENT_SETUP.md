# 🚀 Automatic Deployment Setup Guide

This guide will help you set up automatic deployment to Qovery using GitHub Actions.

## Step 1: Get Your Qovery API Token

1. **Go to Qovery Dashboard**
   - Visit [https://qovery.com](https://qovery.com)
   - Sign in to your account

2. **Create API Token**
   - Go to **Settings** → **API Tokens**
   - Click **"Create Token"**
   - Give it a name like "GitHub Actions Deployment"
   - Copy the generated token (you won't see it again!)

## Step 2: Add Token to GitHub Secrets

1. **Go to Your GitHub Repository**
   - Visit your repository: `https://github.com/ritheshh-cmyk/mobile`

2. **Navigate to Settings**
   - Click on **Settings** tab
   - In the left sidebar, click **Secrets and variables** → **Actions**

3. **Add the Secret**
   - Click **"New repository secret"**
   - **Name**: `QOVERY_TOKEN`
   - **Value**: Paste your Qovery API token
   - Click **"Add secret"**

## Step 3: Set Up Qovery Project (One-time Setup)

1. **Create Project in Qovery**
   - Go to your Qovery dashboard
   - Click **"Create Project"**
   - Name: `mobile-repair-tracker`
   - Click **"Create"**

2. **Connect GitHub Repository**
   - In your project, click **"Create Application"**
   - Choose **"GitHub"** as source
   - Select your repository: `ritheshh-cmyk/mobile`
   - Click **"Connect"**

3. **Configure Application**
   - **Application Name**: `mobile-repair-tracker-backend`
   - **Build Mode**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Port**: `10000`
   - Click **"Create"**

4. **Set Environment Variables**
   - Go to your application settings
   - Click **"Environment Variables"**
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=10000
     FAST2SMS_API_KEY=your-actual-fast2sms-api-key
     ```

## Step 4: Test Automatic Deployment

1. **Make a Small Change**
   - Edit any file in your project
   - Commit and push to main branch

2. **Check GitHub Actions**
   - Go to **Actions** tab in your GitHub repository
   - You should see the "Deploy to Qovery" workflow running

3. **Monitor Deployment**
   - Check the Qovery dashboard for deployment status
   - Your app will be available at the provided URL

## Step 5: Verify Deployment

Once deployed, test these endpoints:

- **Health Check**: `https://your-app-url.qovery.app/health`
- **API Base**: `https://your-app-url.qovery.app/api`
- **Socket.IO**: `https://your-app-url.qovery.app` (WebSocket)

## Troubleshooting

### If GitHub Actions Fails:
1. Check the **Actions** tab for error details
2. Verify your `QOVERY_TOKEN` secret is correct
3. Ensure your Qovery project and application exist

### If Qovery Deployment Fails:
1. Check the Qovery dashboard logs
2. Verify environment variables are set
3. Check that the Dockerfile is in the root directory

### Common Issues:
- **Token Issues**: Make sure the Qovery token has the right permissions
- **Build Failures**: Check that all dependencies are in `package.json`
- **Port Issues**: Ensure the app listens on the correct port (10000)

## Next Steps

After successful deployment:

1. **Update Frontend Configuration**
   - Update your frontend to use the new API URL
   - Test all API endpoints

2. **Set Up Monitoring**
   - Monitor your application logs in Qovery
   - Set up alerts for any issues

3. **Scale if Needed**
   - Adjust resources in Qovery dashboard
   - Set up auto-scaling if required

## Support

- **Qovery Documentation**: [https://docs.qovery.com](https://docs.qovery.com)
- **GitHub Actions**: [https://docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Qovery Community**: [https://community.qovery.com](https://community.qovery.com)

---

🎉 **Congratulations!** Once you complete these steps, every push to your main branch will automatically deploy your backend to Qovery! 