# New Frontend - Mobile Repair Tracker

This directory is ready for your new and improved UI for the Mobile Repair Tracker application.

## Project Status:
- ✅ **Backend is live** at `https://backendmobile-4swg.onrender.com`
- ✅ **All API endpoints are functional**
- ✅ **JWT authentication is working**
- ✅ **Real-time updates via Socket.IO are ready**

## Available API Endpoints:

### Authentication:
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new user

### Transactions:
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Statistics:
- `GET /api/stats/today` - Today's statistics
- `GET /api/stats/week` - This week's statistics
- `GET /api/stats/month` - This month's statistics
- `GET /api/stats/year` - This year's statistics

### Suppliers:
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get specific supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Inventory:
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/:id` - Get specific inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Expenditures:
- `GET /api/expenditures` - Get all expenditures
- `POST /api/expenditures` - Create new expenditure
- `GET /api/expenditures/:id` - Get specific expenditure
- `PUT /api/expenditures/:id` - Update expenditure
- `DELETE /api/expenditures/:id` - Delete expenditure

### Bills:
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Generate new bill
- `GET /api/bills/:id` - Get specific bill

## Default Login Credentials:
- **Username:** `admin`
- **Password:** `admin123`

## Real-time Features:
- Socket.IO connection for live updates
- Real-time transaction notifications
- Live dashboard updates

## Data Types:

### Transaction:
```typescript
{
  id: number;
  customerName: string;
  mobileNumber: string;
  deviceModel: string;
  repairType: string;
  repairCost: string;
  paymentMethod: string;
  amountGiven: string;
  changeReturned: string;
  status: string;
  remarks?: string;
  createdAt: Date;
}
```

### User:
```typescript
{
  id: number;
  username: string;
  password: string;
}
```

## Authentication:
- JWT tokens for API authentication
- Include `Authorization: Bearer <token>` header for protected endpoints

## Notes:
- The backend uses in-memory storage (data resets on restart)
- All endpoints return JSON responses
- Error responses include `error` field with message
- Success responses include `message` field

---
*Ready for your new UI implementation* 