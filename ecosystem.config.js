module.exports = {
  apps: [
    {
      name: "backendserver",
      script: "./server.mjs",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "duckdns-updater",
      script: "./duckdns-updater.sh",
      interpreter: "/data/data/com.termux/files/usr/bin/bash"
    },
    {
      name: "ngrok",
      script: "./ngrok",
      args: "http 3000"
    }
  ]
} 