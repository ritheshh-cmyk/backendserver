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

---

Built with ❤️ for mobile repair shops worldwide. 