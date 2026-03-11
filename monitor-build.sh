#!/bin/bash
cd /Users/clawdbot/Projects/PepCheck/mobile
export EXPO_TOKEN="x_yD45ENKcc6gqoeljmHdTewA0EzTaGj32zSueXh"

BUILD_ID="537bc274-7d70-4ca1-8d88-92ee880add5a"

while true; do
    STATUS=$(./node_modules/.bin/eas build:view $BUILD_ID --json 2>/dev/null | jq -r '.status')
    echo "$(date): Build status: $STATUS"
    
    if [ "$STATUS" = "FINISHED" ]; then
        echo "Build finished! Submitting to TestFlight..."
        ./node_modules/.bin/eas submit --platform ios --profile production --latest --non-interactive
        break
    elif [ "$STATUS" = "ERRORED" ] || [ "$STATUS" = "CANCELED" ]; then
        echo "Build failed: $STATUS"
        break
    fi
    
    sleep 60
done
