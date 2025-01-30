#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="maiqr-nostr-relay"
DEPLOY_PATH="/opt/maiqr/nostr-relay"
BACKUP_PATH="/opt/maiqr/backups"
LOG_PATH="/var/log/pm2"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting deployment of $APP_NAME..."

# 1. Create necessary directories
echo "Creating directories..."
mkdir -p $DEPLOY_PATH
mkdir -p $BACKUP_PATH
mkdir -p $LOG_PATH

# 2. Backup current version
if [ -d "$DEPLOY_PATH/current" ]; then
    echo "Backing up current version..."
    cp -r $DEPLOY_PATH/current $BACKUP_PATH/$APP_NAME-$TIMESTAMP
fi

# 3. Database backup
echo "Creating database backup..."
pg_dump -h localhost -p 5433 -U nostr_user nostr_relay > $BACKUP_PATH/db-$APP_NAME-$TIMESTAMP.sql

# 4. Pull latest changes
echo "Pulling latest changes..."
git pull origin master

# 5. Install dependencies
echo "Installing dependencies..."
npm ci

# 6. Build application
echo "Building application..."
npm run build

# 7. Run database migrations
echo "Running database migrations..."
npm run migration:run

# 8. Update PM2 configuration
echo "Updating PM2 configuration..."
cp ecosystem.config.js $DEPLOY_PATH/
mkdir -p $DEPLOY_PATH/current
rsync -av --delete dist/ $DEPLOY_PATH/current/dist/
rsync -av package*.json $DEPLOY_PATH/current/

# 9. Restart application
echo "Restarting application..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 reload ecosystem.config.js
else
    pm2 start ecosystem.config.js
fi

# 10. Verify deployment
echo "Verifying deployment..."
curl -s http://localhost:3010/health > /dev/null
if [ $? -eq 0 ]; then
    echo "Deployment successful!"
else
    echo "Deployment verification failed!"
    echo "Rolling back..."
    if [ -d "$BACKUP_PATH/$APP_NAME-$TIMESTAMP" ]; then
        rsync -av --delete $BACKUP_PATH/$APP_NAME-$TIMESTAMP/ $DEPLOY_PATH/current/
        pm2 reload ecosystem.config.js
        psql -h localhost -p 5433 -U nostr_user nostr_relay < $BACKUP_PATH/db-$APP_NAME-$TIMESTAMP.sql
        echo "Rollback complete."
    else
        echo "No backup found for rollback!"
    fi
    exit 1
fi

# 11. Cleanup old backups (keep last 5)
echo "Cleaning up old backups..."
cd $BACKUP_PATH
ls -t $APP_NAME-* | tail -n +6 | xargs -r rm -rf
ls -t db-$APP_NAME-* | tail -n +6 | xargs -r rm -f

echo "Deployment completed successfully!"
