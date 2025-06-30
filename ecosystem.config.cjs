module.exports = {
  apps: [
    {
      name: 'backendserver',
      script: 'server.mjs',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 10000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 10000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    },
    {
      name: 'connection-manager',
      script: 'scripts/connection-manager.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/connection-err.log',
      out_file: './logs/connection-out.log',
      log_file: './logs/connection-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 2000,
      kill_timeout: 3000
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
