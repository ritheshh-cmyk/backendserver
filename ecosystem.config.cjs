module.exports = {
  apps: [
    {
      name: "connection-manager",
      script: "./scripts/connection-manager.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 10000,
        GIST_ID: process.env.GIST_ID || "d394f3df4c86cf1cb0040a7ec4138bfd",
        GIST_FILENAME: process.env.GIST_FILENAME || "backend-url.txt",
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
        NGROK_AUTH_TOKEN: process.env.NGROK_AUTH_TOKEN || "",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
        TELEGRAM_ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS || "true"
      },
      error_file: "./logs/connection-manager-error.log",
      out_file: "./logs/connection-manager.log",
      log_file: "./logs/connection-manager-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "100M",
      restart_delay: 5000,
      max_restarts: 15,
      min_uptime: "30s",
      instances: 1,
      exec_mode: "fork"
    },
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
      min_uptime: "10s",
      instances: 1,
      exec_mode: "fork",
      wait_ready: true,
      listen_timeout: 30000
    },
    {
      name: "duckdns-updater",
      script: "./scripts/duckdns-updater.js",
      watch: false,
      env: {
        DUCKDNS_DOMAIN: process.env.DUCKDNS_DOMAIN || "",
        DUCKDNS_TOKEN: process.env.DUCKDNS_TOKEN || "",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
        TELEGRAM_ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS || "true"
      },
      error_file: "./logs/duckdns-error.log",
      out_file: "./logs/duckdns.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_restarts: 5,
      restart_delay: 30000,
      instances: 1,
      exec_mode: "fork"
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
      restart_delay: 5000,
      instances: 1,
      exec_mode: "fork"
    }
  ]
}
