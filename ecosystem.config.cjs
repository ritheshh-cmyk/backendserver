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
      error_file: "./backendserver-error.log",
      out_file: "./backendserver.log",
      log_file: "./backendserver-combined.log"
    },
    {
      name: "duckdns-updater",
      script: "./duckdns-updater.sh",
      interpreter: "bash",
      env: {
        DUCKDNS_DOMAIN: process.env.DUCKDNS_DOMAIN || "",
        DUCKDNS_TOKEN: process.env.DUCKDNS_TOKEN || ""
      }
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
      }
    },
    {
      name: "telegram-bot",
      script: "./scripts/telegram-bot.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || ""
      }
    }
  ]
} 