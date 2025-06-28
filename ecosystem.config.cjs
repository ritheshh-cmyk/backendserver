module.exports = {
  apps: [
    {
      name: "backendserver",
      script: "./server.mjs",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 10000
      },
      error_file: "./logs/backendserver-error.log",
      out_file: "./logs/backendserver.log",
      log_file: "./logs/backendserver-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "200M",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s"
    },
    {
      name: "duckdns-updater",
      script: "./duckdns-updater.sh",
      interpreter: "bash",
      env: {
        DUCKDNS_DOMAIN: process.env.DUCKDNS_DOMAIN || "",
        DUCKDNS_TOKEN: process.env.DUCKDNS_TOKEN || ""
      },
      error_file: "./logs/duckdns-error.log",
      out_file: "./logs/duckdns.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_restarts: 5,
      restart_delay: 30000
    },
    {
      name: "ngrok-manager",
      script: "./update-ngrok-gist-v2.sh",
      interpreter: "bash",
      env: {
        PORT: 10000,
        GIST_ID: process.env.GIST_ID || "d394f3df4c86cf1cb0040a7ec4138bfd",
        GIST_FILENAME: process.env.GIST_FILENAME || "backend-url.txt",
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
        TELEGRAM_ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS || "true"
      },
      error_file: "./logs/ngrok-manager-error.log",
      out_file: "./logs/ngrok-manager.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_restarts: 10,
      restart_delay: 10000,
      min_uptime: "30s"
    },
    {
      name: "telegram-bot",
      script: "./scripts/telegram-bot.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
        TELEGRAM_CHECK_INTERVAL: process.env.TELEGRAM_CHECK_INTERVAL || "30000",
        TELEGRAM_ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS || "true"
      },
      error_file: "./logs/telegram-bot-error.log",
      out_file: "./logs/telegram-bot.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_restarts: 5,
      restart_delay: 5000
    }
  ]
} 