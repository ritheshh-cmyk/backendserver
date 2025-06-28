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

## Android/Termux
1. Open Termux in your backend directory.
2. Run:
   ```sh
   ./start-backend-server.sh
   ```
   - This loads your .env, starts all services with PM2, and shows status.
   - For auto-start on boot, use the Termux:Boot app and reboot your device.

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