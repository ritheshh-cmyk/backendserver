# Mobile Repair Tracker - "Call Me Mobiles"

[![Deploy to Qovery](https://github.com/ritheshh-cmyk/mobile/workflows/Deploy%20to%20Qovery/badge.svg)](https://github.com/ritheshh-cmyk/mobile/actions)

A comprehensive mobile repair shop management system with real-time updates, SMS notifications, and multi-shop support.

## 🚀 Features

- **Transaction Management**: Track repairs, costs, and customer details
- **Inventory Management**: Manage parts and suppliers
- **Real-time Updates**: Socket.IO for live data synchronization
- **SMS Notifications**: Fast2SMS integration for customer updates
- **Multi-shop Support**: Separate data for different shop locations
- **Reporting**: Comprehensive analytics and reports
- **Billing System**: Generate and manage customer bills

## 🏗️ Architecture

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: In-memory storage (can be extended to PostgreSQL)
- **Deployment**: Qovery with automatic CI/CD

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ritheshh-cmyk/mobile.git
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env-example.txt .env
   
   # Edit .env and add your Fast2SMS API key
   FAST2SMS_API_KEY=your-api-key-here
   ```

4. **Build and start the backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

5. **Start the frontend**
   ```bash
   # In a new terminal
   cd frontend-new
   npm install
   npm run dev
   ```

## 🌐 Deployment

This project is configured for automatic deployment to Qovery. Every push to the main branch triggers an automatic deployment.

### Manual Deployment
See [QOVERY_DEPLOYMENT.md](QOVERY_DEPLOYMENT.md) for detailed deployment instructions.

### Automatic Deployment Setup
See [AUTO_DEPLOYMENT_SETUP.md](AUTO_DEPLOYMENT_SETUP.md) for setting up automatic deployment.

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:10000`
- **Production**: `https://your-app-url.qovery.app`

### Endpoints

#### Health Check
```
GET /health
```

#### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

#### Transactions
```
GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

#### Suppliers
```
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

#### Inventory
```
GET    /api/inventory
POST   /api/inventory
GET    /api/inventory/:id
PUT    /api/inventory/:id
DELETE /api/inventory/:id
```

#### Expenditures
```
GET    /api/expenditures
POST   /api/expenditures
GET    /api/expenditures/:id
PUT    /api/expenditures/:id
DELETE /api/expenditures/:id
```

#### SMS Notifications
```
POST /api/sms/send
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | Yes |
| `FAST2SMS_API_KEY` | Fast2SMS API key | Yes |

### Socket.IO Events

The backend emits these real-time events:

- `transactionCreated` - New transaction added
- `transactionUpdated` - Transaction updated
- `transactionDeleted` - Transaction deleted
- `supplierCreated` - New supplier added
- `supplierUpdated` - Supplier updated
- `supplierDeleted` - Supplier deleted
- `inventoryUpdated` - Inventory item updated
- `expenditureCreated` - New expenditure added
- `expenditureUpdated` - Expenditure updated
- `expenditureDeleted` - Expenditure deleted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🚀 Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] User authentication and authorization
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Customer portal
- [ ] Advanced inventory management
- [ ] Multi-language support

# Termux/Phone Self-Hosted Backend Setup

This project now supports running a self-hosted backend API on Android devices using Termux. All scripts for running the backend server, DuckDNS updater, and PM2 process management are located in the `scripts/` directory. See `scripts/README.md` for setup instructions.

---

Built with ❤️ for mobile repair shops worldwide. 

# backendserver

## Features

- Node.js Express API on port 3000
- Local JSON database (lowdb)
- Public access via https://rithesh.duckdns.org/api/...
- Automatic DuckDNS IP update every 5 minutes
- Always-on with PM2 (auto-restart, boot persistence)
- Developer-friendly logs

## Setup Steps (on Android/Termux)

1. Install Termux from F-Droid.
2. Update and install dependencies:
   ```
   pkg update -y
   pkg upgrade -y
   pkg install -y nodejs git curl
   npm install -g pm2
   ```
3. Clone this repo and enter it:
   ```
   git clone https://github.com/ritheshh-cmyk/backendserver.git
   cd backendserver
   ```
4. Install project dependencies:
   ```
   npm install
   ```
5. Start everything with PM2:
   ```
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
6. (Optional) Prevent sleep:
   ```
   termux-wake-lock
   ```
7. Access your API at: https://rithesh.duckdns.org/api/expense

## Logs

- View logs with:
  ```
  pm2 logs
  ```

## Notes

- The server and database work offline.
- DuckDNS updater keeps your domain pointed to your current public IP.
- PM2 ensures everything restarts after reboot or crash.

# One-Click Backend Start

## Ubuntu-in-Termux (proot-distro)
1. Open your Ubuntu-in-Termux shell and cd to your backend directory.
2. Run:
   ```sh
   ./start-backend-server.sh
   ```
   - This loads your .env, starts all services with PM2, and shows status.
   - For auto-start on boot, use your proot-distro's init system or add to `.bashrc`.

## Windows/PowerShell
1. Open PowerShell in your backend directory.
2. Run:
   ```powershell
   ./start-backend-server.ps1
   ```
   - This loads your .env, starts all services with PM2, and shows status.

## Requirements
- Node.js (v18+ recommended)
- PM2 (`npm install -g pm2`)
- (Optional) ngrok or DuckDNS for public access
- (Optional) Telegram bot token for notifications

## Environment Variables
Edit the `.env` file in your project root:
```
NODE_ENV=production
PORT=10000
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
DB_FILE=db.json
```

--- 

# Mobile Repair Tracker - Backend Server

A Node.js backend server for mobile repair tracking with PM2 process management, auto-start capabilities, and public exposure via Ngrok or DuckDNS.

## 🚀 Quick Start

### Ubuntu-in-Termux (proot-distro)
```bash
# One-time setup (with safety checks and error handling)
./setup-backend.sh

# Start the server
./start-backend-server.sh

# Setup auto-start on boot
./setup-auto-start.sh
```

### Windows/PowerShell
```powershell
# One-time setup (with safety checks and error handling)
./setup-backend.ps1

# Start the server
./start-backend-server.ps1
```

## 📋 Requirements

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **curl** (for health checks)
- **PM2** (installed automatically by setup scripts)
- **Optional**: ngrok or DuckDNS for public access
- **Optional**: Telegram bot token for notifications

## 🔧 Setup Instructions

### 1. Initial Setup

#### Ubuntu-in-Termux
```bash
# Clone or download your project
cd ~/MobileRepairTracker-1

# Run the setup script (includes safety checks)
./setup-backend.sh
```

#### Windows
```powershell
# Clone or download your project
cd C:\path\to\MobileRepairTracker-1

# Run the setup script (includes safety checks)
./setup-backend.ps1
```

### 2. Configure Environment Variables

Edit the `.env` file with your actual values:
```env
# Backend Server Configuration
NODE_ENV=production
PORT=10000

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Database Configuration
DB_FILE=db.json
```

### 3. Start the Server

#### Ubuntu-in-Termux
```bash
./start-backend-server.sh
```

#### Windows
```powershell
./start-backend-server.ps1
```

### 4. Auto-Start on Boot (Ubuntu-in-Termux)

```bash
./setup-auto-start.sh
```

This will add the backend start command to your `~/.bashrc` so it starts automatically when you open Ubuntu-in-Termux.

## 🛡️ Safety Features

### Error Handling
- **`set -e`** - Scripts exit immediately on any error
- **Dependency checks** - Verify Node.js, npm, curl, PM2 are installed
- **Port conflict detection** - Warn if port 10000 is already in use
- **File existence checks** - Ensure required files exist before proceeding
- **Graceful fallbacks** - Handle missing commands like `timeout`

### Security
- **Silent npm installs** - Reduce log noise and potential security exposure
- **Absolute paths** - Use `./script.sh` instead of relative paths
- **Environment validation** - Check and validate environment variables
- **PM2 Termux support** - Proper startup configuration for Termux environments

## 📊 Management Commands

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Delete all services
pm2 delete all
```

### Server Health Check
```bash
# Test if backend is responding
curl http://localhost:10000/api/ping
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Cannot find package 'lowdb'"
```bash
npm install
```

#### 2. "PM2 command not found"
```bash
npm install -g pm2
```

#### 3. "Permission denied" on scripts
```bash
chmod +x *.sh
```

#### 4. "curl is not installed"
```bash
sudo apt-get install curl
```

#### 5. "timeout command not found"
```bash
sudo apt-get install coreutils
```

#### 6. Server not responding on port 10000
- Check if the server is running: `pm2 status`
- Check logs: `pm2 logs`
- Verify .env has correct PORT=10000
- Check if port is already in use: `lsof -i :10000`

#### 7. Auto-start not working (Ubuntu-in-Termux)
- Check if the command was added to ~/.bashrc
- Run: `source ~/.bashrc` to test immediately
- Verify the path in ~/.bashrc is correct

#### 8. PM2 startup fails
- Try: `pm2 startup termux` for Termux environments
- Check if running as root (may be required for startup)

### Log Files
- `backendserver.log` - Server output
- `backendserver-error.log` - Server errors
- `backendserver-combined.log` - Combined logs

## 📱 Public Access Setup

### Option 1: Ngrok
1. Sign up at https://ngrok.com
2. Get your auth token
3. Add to .env: `NGROK_AUTH_TOKEN=your_token`
4. The ecosystem config will start ngrok automatically

### Option 2: DuckDNS
1. Sign up at https://duckdns.org
2. Create a subdomain
3. Add to .env: `DUCKDNS_DOMAIN=your_subdomain.duckdns.org` and `DUCKDNS_TOKEN=your_token`
4. The ecosystem config will start the DuckDNS updater automatically

## 🤖 Telegram Bot Setup

1. Create a bot with @BotFather on Telegram
2. Get your bot token
3. Get your chat ID (send a message to your bot and check https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates)
4. Add to .env: `TELEGRAM_BOT_TOKEN=your_token` and `TELEGRAM_CHAT_ID=your_chat_id`

## 📁 File Structure

```
MobileRepairTracker-1/
├── server.mjs                 # Main server file
├── ecosystem.config.js        # PM2 configuration
├── start-backend-server.sh    # Ubuntu/Termux start script
├── start-backend-server.ps1   # Windows start script
├── setup-backend.sh           # Ubuntu/Termux setup script
├── setup-backend.ps1          # Windows setup script
├── setup-auto-start.sh        # Auto-start setup script
├── duckdns-updater.sh         # DuckDNS updater script
├── scripts/
│   └── telegram-bot.js        # Telegram bot script
├── .env                       # Environment variables
├── db.json                    # Local database
└── README.md                  # This file
```

## 🔄 API Endpoints

- `GET /api/ping` - Health check
- `POST /api/expense` - Add expense
- `GET /api/expense` - Get all expenses

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Check PM2 logs: `pm2 logs`
3. Verify your .env configuration
4. Test the server manually: `node server.mjs`
5. Run setup script again: `./setup-backend.sh`

---

**Your backend is now ready for production use with enhanced safety and error handling! 🎉** 