module.exports = {
  apps: [
    {
      name: "backend",
      script: "./scripts/server.js",
      watch: true
    },
    {
      name: "duckdns",
      script: "./scripts/duckdns-updater.js",
      watch: false
    }
  ]
} 