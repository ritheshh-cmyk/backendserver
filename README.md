# Mobile Repair Tracker

A comprehensive mobile repair shop management system with real-time tracking, e-bill generation, SMS/WhatsApp integration, and secure authentication.

## 🚀 Features

- **Transaction Management**: Create and track repair transactions
- **Supplier Management**: Manage suppliers and track dues
- **Expenditure Tracking**: Monitor parts and service costs
- **E-Bill Generation**: Generate professional bills with QR codes
- **SMS/WhatsApp Integration**: Send notifications to customers
- **Real-time Sync**: Live updates across all devices
- **Secure Authentication**: JWT-based user authentication
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Multi-language Support**: English and Hindi interfaces

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **Deployment**: Vercel (Frontend + Backend)

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Fast2SMS API key (for SMS)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mobile-repair-tracker.git
   cd mobile-repair-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-example.txt .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Backend
   node server-secure.js
   
   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Default admin: admin/admin123

## 🌐 Vercel Deployment

### Frontend + Backend Deployment

This project is configured for full-stack deployment on Vercel with the following structure:

```
/
├── api/                    # Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts
│   │   └── register.ts
│   ├── suppliers/
│   │   ├── index.ts
│   │   └── payments.ts
│   ├── transactions/
│   │   └── index.ts
│   └── test.ts
├── frontend/              # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Backend libraries
├── shared/                # Shared types and schemas
├── vercel.json           # Vercel configuration
└── package.json
```

### Deployment Steps

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   
   Go to your Vercel project dashboard → Settings → Environment Variables and add:

   **Backend Variables:**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-here
   FAST2SMS_API_KEY=your-fast2sms-api-key
   FAST2SMS_SENDER_ID=your-sender-id
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   ```

   **Frontend Variables:**
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app/api
   VITE_SOCKET_URL=https://your-backend-domain.vercel.app
   ```

4. **Redeploy after setting environment variables**
   ```bash
   vercel --prod
   ```

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `FAST2SMS_API_KEY` | Fast2SMS API key for SMS | No |
| `FAST2SMS_SENDER_ID` | SMS sender ID | No |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |

## 📱 Mobile App Build

### Android APK
```bash
# Install Android build tools
npm install -g @capacitor/cli
npx cap add android
npx cap build android
```

### Windows EXE
```bash
npm run electron:build
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `DELETE /api/transactions` - Clear all transactions (admin)

### Suppliers
- `GET /api/suppliers` - Get all suppliers with dues
- `POST /api/suppliers` - Create new supplier
- `DELETE /api/suppliers` - Clear all suppliers (admin)

### Supplier Payments
- `GET /api/suppliers/payments` - Get all payments
- `POST /api/suppliers/payments` - Record payment
- `DELETE /api/suppliers/payments` - Clear all payments (admin)

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User authentication and roles
- `transactions` - Repair transactions
- `expenditures` - Parts and service costs
- `suppliers` - Supplier information
- `supplier_payments` - Payment history

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Input validation with Zod
- SQL injection prevention

## 🧪 Testing

```bash
# Run all tests
node test-complete-system.js

# Test specific features
node test-ebill-features.js
node test-secure-authentication.js
node test-realtime-sync.js
```

## 📊 Monitoring & Analytics

- Real-time transaction tracking
- Supplier due monitoring
- Expenditure analytics
- Payment history
- User activity logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test files for examples

## 🔄 Updates

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added Vercel deployment support
- **v1.2.0**: Enhanced security and real-time features

---

**Built with ❤️ for mobile repair businesses** 