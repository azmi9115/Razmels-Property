#!/bin/bash

# Target port on localhost
TARGET_URL="http://localhost:3001"

# Get HTTP status code, timeout after 10 seconds
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $TARGET_URL)

if [ "$HTTP_STATUS" = "000" ] || [ "$HTTP_STATUS" = "502" ] || [ "$HTTP_STATUS" = "504" ]; then
    echo "$(date) - [ERROR] Service is down (HTTP $HTTP_STATUS). Initiating auto-heal..." >> /var/log/auto-heal.log
    
    # Force kill stuck containerd-shim processes
    pkill -9 containerd-shim
    
    # Restart docker service
    systemctl restart docker
    
    # Wait a few seconds for docker daemon to fully start
    sleep 5
    
    # Restart the application
    cd /home/aril/Razmels-Property
    docker compose up -d --force-recreate >> /var/log/auto-heal.log 2>&1
    
    echo "$(date) - [INFO] Auto-heal completed successfully." >> /var/log/auto-heal.log
fi
