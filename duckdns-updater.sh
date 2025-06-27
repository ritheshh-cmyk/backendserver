#!/data/data/com.termux/files/usr/bin/bash

DOMAIN="rithesh"
TOKEN="074701d3-3ec1-4f25-9231-f255b78d6192"  # <-- Updated with your actual DuckDNS token

while true; do
  IP=$(curl -s http://ipecho.net/plain)
  echo "[$(date)] Updating DuckDNS to $IP"
  curl "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=$IP"
  echo "IP updated"
  sleep 300 # 5 minutes
done 