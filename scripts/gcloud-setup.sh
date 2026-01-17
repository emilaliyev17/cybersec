#!/bin/bash

# ==============================================================================
# GCloud Setup Script for Security Onboarding Application
# ==============================================================================

set -e

PROJECT_ID="contract-management-473819"
REGION="us-central1"
DB_INSTANCE="strategybrix-postgres"
DB_NAME="security_onboarding"
DB_USER="security_app"

echo "🚀 Setting up GCloud infrastructure..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Set project
gcloud config set project $PROJECT_ID

# ------------------------------------------------------------------------------
# 1. Enable required APIs
# ------------------------------------------------------------------------------
echo "📦 Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  --quiet

echo "✅ APIs enabled"

# ------------------------------------------------------------------------------
# 2. Create Cloud SQL instance (if not exists)
# ------------------------------------------------------------------------------
echo "🗄️ Checking Cloud SQL instance..."
if gcloud sql instances describe $DB_INSTANCE --quiet 2>/dev/null; then
  echo "✅ Cloud SQL instance '$DB_INSTANCE' already exists"
else
  echo "Creating Cloud SQL instance '$DB_INSTANCE'..."
  gcloud sql instances create $DB_INSTANCE \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --availability-type=zonal \
    --quiet
  echo "✅ Cloud SQL instance created"
fi

# ------------------------------------------------------------------------------
# 3. Create database
# ------------------------------------------------------------------------------
echo "🗄️ Creating database '$DB_NAME'..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE --quiet 2>/dev/null || echo "Database may already exist"
echo "✅ Database ready"

# ------------------------------------------------------------------------------
# 4. Create database user
# ------------------------------------------------------------------------------
echo "👤 Creating database user..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE \
  --password=$DB_PASSWORD \
  --quiet 2>/dev/null || echo "User may already exist"

# ------------------------------------------------------------------------------
# 5. Create secrets in Secret Manager
# ------------------------------------------------------------------------------
echo "🔐 Setting up secrets..."

# DB User
echo -n $DB_USER | gcloud secrets create db-user --data-file=- --quiet 2>/dev/null || \
  echo -n $DB_USER | gcloud secrets versions add db-user --data-file=-

# DB Password
echo -n $DB_PASSWORD | gcloud secrets create db-password --data-file=- --quiet 2>/dev/null || \
  echo -n $DB_PASSWORD | gcloud secrets versions add db-password --data-file=-

# JWT Secret
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo -n $JWT_SECRET | gcloud secrets create jwt-secret --data-file=- --quiet 2>/dev/null || \
  echo -n $JWT_SECRET | gcloud secrets versions add jwt-secret --data-file=-

echo "✅ Secrets configured"

# ------------------------------------------------------------------------------
# 6. Grant Cloud Run access to secrets
# ------------------------------------------------------------------------------
echo "🔑 Granting permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_RUN_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for secret in db-user db-password jwt-secret; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$CLOUD_RUN_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
done

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CLOUD_RUN_SA" \
  --role="roles/cloudsql.client" \
  --quiet

echo "✅ Permissions granted"

# ------------------------------------------------------------------------------
# 7. Connect to Cloud Build GitHub
# ------------------------------------------------------------------------------
echo ""
echo "========================================"
echo "✅ Infrastructure setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Connect GitHub repo to Cloud Build:"
echo "   https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo ""
echo "2. Create trigger for 'main' branch with cloudbuild.yaml"
echo ""
echo "3. Run initial database migration:"
echo "   gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME"
echo "   Then run: schema.sql, seed.sql, migration_tracks.sql"
echo ""
echo "Database credentials saved to Secret Manager"
echo "========================================"
