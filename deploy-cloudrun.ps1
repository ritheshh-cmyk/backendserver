# Google Cloud Run Deployment Script for Mobile Repair Tracker Backend
# Edit the variables below before running

# === USER CONFIGURATION ===
$PROJECT_ID = "your-gcp-project-id"           # <-- CHANGE THIS
$REGION = "us-central1"                       # <-- CHANGE IF NEEDED
$SERVICE_NAME = "mobile-repair-backend"       # <-- CHANGE IF NEEDED
$PORT = 10000                                  # <-- CHANGE IF NEEDED
$FAST2SMS_API_KEY = "your-fast2sms-api-key"   # <-- CHANGE THIS

# === SCRIPT START ===
Write-Host "\n[1/6] Setting GCP project..."
gcloud config set project $PROJECT_ID

Write-Host "\n[2/6] Enabling required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

Write-Host "\n[3/6] Building and pushing Docker image..."
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "\n[4/6] Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,PORT=$PORT,FAST2SMS_API_KEY=$FAST2SMS_API_KEY"

Write-Host "\n[5/6] Fetching deployed service URL..."
$serviceUrl = gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
Write-Host "\n[6/6] Deployment complete! Your backend is live at: $serviceUrl\n" 