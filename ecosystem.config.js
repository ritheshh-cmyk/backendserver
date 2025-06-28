module.exports = {
  apps: [
    {
      name: "ngrok-backend",
      script: "./server.mjs",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 10000
      },
      error_file: "./ngrok-backend-error.log",
      out_file: "./ngrok-backend.log",
      log_file: "./ngrok-backend-combined.log"
    },
    {
      name: "duckdns-updater",
      script: "./duckdns-updater.sh",
      interpreter: "/data/data/com.termux/files/usr/bin/bash"
    },
    {
      name: "telegram-bot",
      script: "./scripts/telegram-bot.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
} 