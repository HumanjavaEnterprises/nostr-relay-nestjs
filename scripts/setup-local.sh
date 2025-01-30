#!/bin/bash
set -e

echo "Setting up local Nostr relay environment..."

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies
echo "Installing project dependencies..."
npm install

# Generate Nostr keys if not already present
echo "Generating Nostr keys..."
if [ ! -f .env ] || ! grep -q "RELAY_PUBKEY" .env; then
    cd ../maiqrapp-api-platform
    npm install nostr-crypto-utils
    node scripts/nostr-keys-generate.js > ../nostr-relay-nestjs/relay-keys.txt
    cd ../nostr-relay-nestjs
fi

# Create or update .env file
echo "Setting up environment variables..."
cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://nostr_user:nostr_password@localhost:5433/nostr_relay
DATABASE_MAX_CONNECTIONS=50
DATABASE_MIN_CONNECTIONS=5
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=5000
DATABASE_SSL=false
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=10000

# Server Configuration
PORT=3010
HOST=127.0.0.1
MAX_PAYLOAD_SIZE=1048576

# Event Limits
MIN_POW_DIFFICULTY=0.1
MAX_EVENT_TAGS=2000

# Relay Configuration
RELAY_NAME="MaiQR Local Dev Relay"
RELAY_DESCRIPTION="Local development relay for MaiQR.app"
$(grep "NOSTR_DM_PRIVATE_KEY" relay-keys.txt | sed 's/NOSTR_DM_PRIVATE_KEY/RELAY_PRIVATE_KEY/')
$(grep "NOSTR_DM_PUBLIC_KEY" relay-keys.txt | sed 's/NOSTR_DM_PUBLIC_KEY/RELAY_PUBKEY/')
RELAY_CONTACT=dev@maiqr.app
EOL

# Build the project
echo "Building the project..."
npm run build

# Start the relay with PM2
echo "Starting Nostr relay with PM2..."
pm2 delete nostr-relay 2>/dev/null || true
pm2 start dist/src/main.js --name nostr-relay

echo "Local setup complete!"
echo "Your Nostr relay should be running at http://localhost:3010"
echo "To view logs, run: pm2 logs nostr-relay"
echo "To stop the relay, run: pm2 stop nostr-relay"
