# Mobile Repair Tracker

A comprehensive mobile repair business management system with real-time sync, secure authentication, and e-bill generation.

## 🚀 Features

- **Customer Management**: Track customer details and repair history
- **Transaction Processing**: Complete repair transactions with payment tracking
- **Supplier Management**: Manage suppliers and track dues/payments
- **Inventory Tracking**: Monitor parts and supplies
- **E-Bill Generation**: Generate and send bills via SMS/WhatsApp
- **Real-time Sync**: Live updates across all devices
- **Secure Authentication**: JWT-based authentication with role-based access
- **Multi-platform**: Web, Mobile (PWA), and Desktop (Electron)

## 📁 Project Structure

```
mobile-repair-tracker/
├── frontend/                 # React frontend (Vercel deployment)
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                  # Serverless backend (Vercel Functions)
│   ├── api/                 # Vercel serverless functions
│   ├── lib/                 # Shared utilities
│   └── package.json
├── shared/                  # Shared types and utilities
└── desktop/                 # Electron desktop app
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Query for data fetching
- Socket.IO for real-time updates

### Backend
- Vercel Serverless Functions
- Neon PostgreSQL database
- JWT authentication
- Fast2SMS integration
- Socket.IO for real-time sync

### Desktop
- Electron for cross-platform desktop app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Neon PostgreSQL database
- Fast2SMS API key

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd mobile-repair-tracker
```

2. **Set up environment variables**

Create `.env.local` in the frontend directory:
```env
VITE_API_URL=https://your-backend.vercel.app/api
VITE_SOCKET_URL=https://your-backend.vercel.app
```

Create `.env` in the backend directory:
```env
DATABASE_URL=your-neon-postgresql-url
JWT_SECRET=your-jwt-secret
FAST2SMS_API_KEY=your-fast2sms-api-key
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Development

1. **Start the backend**
```bash
cd backend
npm install
npm run dev
```

2. **Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Start the desktop app**
```bash
cd desktop
npm install
npm run dev
```

## 📦 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Backend (Vercel Functions)
1. Backend functions are automatically deployed with frontend
2. Set environment variables in Vercel dashboard
3. Functions are available at `/api/*` endpoints

### Database (Neon)
1. Create Neon PostgreSQL database
2. Update `DATABASE_URL` in environment variables
3. Database schema is auto-created on first connection

## 🔧 Configuration

### Database Schema
The application automatically creates the following tables:
- `users` - User authentication and roles
- `transactions` - Customer repair transactions
- `suppliers` - Supplier information
- `expenditures` - Parts and supplies tracking
- `payments` - Supplier payment history
- `bills` - Generated e-bills

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user

#### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions` - Clear all transactions

#### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

#### E-Bills
- `POST /api/bills/generate` - Generate e-bill
- `GET /api/bills` - List bills
- `POST /api/bills/send-sms` - Send bill via SMS

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 📱 Mobile App

The frontend is a Progressive Web App (PWA) that can be installed on mobile devices:
1. Open the web app on your mobile browser
2. Add to home screen
3. Use as a native app

## 🖥️ Desktop App

Build the desktop app:
```bash
cd desktop
npm run build
```

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Environment variable protection
- CORS configuration
- Input validation and sanitization

## 📞 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 📄 License

MIT License - see LICENSE file for details 