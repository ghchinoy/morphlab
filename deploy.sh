#!/bin/bash

# Configuration
PROJECT_ID=${1:-${GOOGLE_CLOUD_PROJECT}}
REGION=${GOOGLE_CLOUD_LOCATION:-us-central1}
MODEL_LOCATION=${GEMINI_LOCATION:-global}
GEMINI_MODEL=${GEMINI_MODEL:-gemini-4-argon}
SERVICE_NAME="morphlab"
SERVICE_ACCOUNT_NAME="${SERVICE_NAME}-sa"

set -e # Exit on error

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: PROJECT_ID not specified and GOOGLE_CLOUD_PROJECT is not set."
  echo "Usage: $0 [PROJECT_ID]"
  exit 1
fi

# 0. Check for gcloud
if ! command -v gcloud &> /dev/null; then
  echo "❌ Error: gcloud CLI not found. Please install it: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "🚀 Starting deployment for $SERVICE_NAME in project $PROJECT_ID ($REGION) with model $GEMINI_MODEL..."

# 1. Enable necessary services
echo "🔧 Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  --project "$PROJECT_ID"

# 2. Create Service Account if it doesn't exist
echo "👤 Checking for Service Account..."
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID" > /dev/null 2>&1; then
  echo "✨ Creating Service Account: $SERVICE_ACCOUNT_NAME"
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="Service Account for MorphLab SVG Animator" \
    --project "$PROJECT_ID"
else
  echo "✅ Service Account already exists."
fi

# 3. Build and Deploy to Cloud Run
echo "📦 Building container and deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --set-env-vars="GEMINI_MODEL=${GEMINI_MODEL},GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${MODEL_LOCATION}" \
  --allow-unauthenticated \
  --port 8080

echo "🎉 Deployment complete!"
echo "🔗 App URL: $(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
