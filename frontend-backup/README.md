# Frontend Backup - Mobile Repair Tracker

This directory contains a complete backup of the original frontend code for the Mobile Repair Tracker application.

## What's Included:

### Directories:
- `frontend/` - Main frontend application (React + Vite)
- `client/` - Alternative frontend setup
- `src/` - Source files from root
- `public/` - Public assets

### Configuration Files:
- `vite.config.*` - Vite configuration files
- `tailwind.config.*` - Tailwind CSS configuration
- `postcss.config.*` - PostCSS configuration
- `components.json` - UI components configuration
- `*.html` - HTML files

### Key Features of the Original Frontend:
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- Responsive design
- Dark/light theme support
- Mobile-first approach
- Real-time updates via Socket.IO
- JWT authentication
- Dashboard with statistics
- Transaction management
- Inventory management
- Supplier management
- Expenditure tracking
- Bill generation

## Backend API Endpoints Used:
- `POST /api/auth/login` - User authentication
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `GET /api/stats/*` - Get statistics
- `GET /api/suppliers` - Get suppliers
- `GET /api/inventory` - Get inventory
- `GET /api/expenditures` - Get expenditures

## Default Login Credentials:
- Username: `admin`
- Password: `admin123`

## Notes:
- The backend is live at: `https://backendmobile-4swg.onrender.com`
- All API endpoints are functional
- JWT authentication is working
- Real-time updates are implemented

---
*Backup created on: $(Get-Date)* 