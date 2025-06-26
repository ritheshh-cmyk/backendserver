# Deploying to Qovery

This guide will help you deploy your Mobile Repair Tracker backend to Qovery.

## Prerequisites

1. A Qovery account (sign up at https://qovery.com)
2. Git repository with your code
3. Qovery CLI (optional, for local deployment)

## Method 1: Deploy via Qovery Dashboard (Recommended)

### Step 1: Connect Your Repository
1. Log in to your Qovery dashboard
2. Create a new project called "mobile-repair-tracker"
3. Connect your GitHub repository
4. Select the repository containing this code

### Step 2: Configure the Application
1. Create a new application called "mobile-repair-tracker-backend"
2. Set the following configuration:
   - **Build Mode**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Port**: `10000`
   - **Health Check Path**: `/health`

### Step 3: Set Environment Variables
Add these environment variables in the Qovery dashboard:
```
NODE_ENV=production
PORT=10000
FAST2SMS_API_KEY=your-actual-api-key-here
```

### Step 4: Deploy
1. Click "Deploy" in the Qovery dashboard
2. Wait for the build and deployment to complete
3. Your app will be available at the provided URL

## Method 2: Deploy via CLI

### Step 1: Install Qovery CLI
```bash
npm install -g @qovery/cli
```

### Step 2: Login to Qovery
```bash
qovery auth login
```

### Step 3: Run the Deployment Script
```bash
node deploy-qovery.js
```

## Method 3: Deploy via GitHub Actions

### Step 1: Set up Qovery Token
1. Go to your Qovery dashboard
2. Navigate to Settings > API Tokens
3. Create a new token
4. Copy the token

### Step 2: Add Secret to GitHub
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Create a new secret called `QOVERY_TOKEN`
4. Paste your Qovery token as the value

### Step 3: Push to Main Branch
The GitHub Actions workflow will automatically deploy your app when you push to the main branch.

## Configuration Files

### .qovery.yml
This file contains the Qovery configuration for your application.

### Dockerfile
This file defines how to build and run your Node.js application in a Docker container.

### .dockerignore
This file excludes unnecessary files from the Docker build context.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Port to run the server on | Yes |
| `FAST2SMS_API_KEY` | API key for SMS service | Yes |

## Health Check

The application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "OK",
  "message": "Mobile Repair Tracker Backend is running"
}
```

## API Endpoints

Once deployed, your API will be available at:
- Health Check: `https://your-app-url.qovery.app/health`
- API Base: `https://your-app-url.qovery.app/api`
- Socket.IO: `https://your-app-url.qovery.app` (WebSocket)

## Troubleshooting

### Build Failures
- Check that all dependencies are properly listed in `backend/package.json`
- Ensure the Dockerfile is in the root directory
- Verify that the build command works locally

### Runtime Errors
- Check the application logs in the Qovery dashboard
- Verify environment variables are set correctly
- Ensure the port configuration matches your application

### Connection Issues
- Verify the health check endpoint is working
- Check that the port is correctly exposed
- Ensure the application is binding to `0.0.0.0` instead of `localhost`

## Support

For more help with Qovery deployment:
- [Qovery Documentation](https://docs.qovery.com)
- [Qovery Community](https://community.qovery.com)
- [Qovery Support](https://www.qovery.com/support) 