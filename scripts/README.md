# Termux/Phone Self-Hosted Backend Scripts

This directory contains scripts and configuration for running the backend API and DuckDNS updater on Android devices using Termux.

## Prerequisites
- Termux app (Android)
- Node.js and npm (`pkg install nodejs`)
- git (`pkg install git`)
- PM2 process manager (`npm install -g pm2`)

## Setup
1. Clone this repository to your device:
   ```sh
   git clone <your-repo-url>
   cd <repo-folder>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Edit `duckdns-updater.js` and set your DuckDNS token and domain.

## Running the Backend and DuckDNS Updater

Start both processes with PM2:
```sh
pm2 start pm2-ecosystem.config.js
pm2 save
```

- The backend API will run on port 3000.
- The DuckDNS updater will update your public IP every 5 minutes.

## Auto-start on Boot
- Use the [Termux:Boot](https://wiki.termux.com/wiki/Termux:Boot) app to run `pm2 resurrect` on device boot.

## Logs
- View logs with `pm2 logs`.

## HTTPS (Optional)
- For HTTPS, use a reverse proxy like Caddy or Nginx. See project README for details.

--- 