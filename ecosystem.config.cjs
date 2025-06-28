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
      interpreter: "bash"
    },
    {
      name: "ngrok",
      script: "./ngrok",
      args: "http 10000"
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