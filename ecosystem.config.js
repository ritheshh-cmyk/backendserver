module.exports = {
  apps: [
    {
      name: "backendserver",
      script: "./server.mjs",
      watch: true,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "duckdns-updater",
      script: "./duckdns-updater.sh",
      interpreter: "/data/data/com.termux/files/usr/bin/bash"
    }
  ]
} 