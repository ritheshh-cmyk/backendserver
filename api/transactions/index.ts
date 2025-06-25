import { sql } from '../../backend/lib/database.js';
import { authenticateToken } from '../../backend/lib/auth.js';

// Helper to map DB fields to frontend expectations
function mapTransaction(t: any) {
  return {
    id: t.id,
    customerName: t.customer_name,
    mobileNumber: t.mobile_number,
    deviceModel: t.device_model,
    repairType: t.repair_type,
    repairCost: t.repair_cost,
    paymentMethod: t.payment_method,
    amountGiven: t.amount_given,
    changeReturned: t.change_returned,
    status: t.status,
    remarks: t.remarks,
    createdAt: t.created_at,
    expenditures: t.expenditures || [],
  };
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const user = await authenticateToken(req);
    if (!user) {
      return res.status(401).json({ data: null, error: 'Authentication required' });
    }

    switch (req.method) {
      case 'GET': {
        // Get all transactions
        const transactions = await sql`
          SELECT 
            t.*,
            json_agg(
              json_build_object(
                'id', e.id,
                'item', e.item,
                'cost', e.cost,
                'store', e.store,
                'customStore', e.custom_store,
                'createdAt', e.created_at
              )
            ) as expenditures
          FROM transactions t
          LEFT JOIN expenditures e ON t.id = e.transaction_id
          GROUP BY t.id
          ORDER BY t.created_at DESC
        `;
        return res.status(200).json({ data: transactions.map(mapTransaction), error: null });
      }
      case 'POST': {
        const {
          customerName,
          mobileNumber,
          deviceModel,
          repairType,
          repairCost,
          paymentMethod,
          amountGiven,
          changeReturned,
          status,
          remarks,
          partsCost
        } = req.body;
        // Validate required fields
        if (!customerName || !mobileNumber || !deviceModel || !repairType || !repairCost) {
          return res.status(400).json({ data: null, error: 'Missing required fields' });
        }
        // Create transaction
        const newTransaction = await sql`
          INSERT INTO transactions (
            customer_name, mobile_number, device_model, repair_type, 
            repair_cost, payment_method, amount_given, change_returned, 
            status, remarks, created_at
          )
          VALUES (
            ${customerName}, ${mobileNumber}, ${deviceModel}, ${repairType},
            ${repairCost}, ${paymentMethod}, ${amountGiven}, ${changeReturned},
            ${status}, ${remarks}, NOW()
          )
          RETURNING *
        `;
        const transaction = newTransaction[0];
        // Create expenditures if partsCost is provided
        if (partsCost && Array.isArray(partsCost)) {
          for (const part of partsCost) {
            await sql`
              INSERT INTO expenditures (
                transaction_id, item, cost, store, custom_store, created_at
              )
              VALUES (
                ${transaction.id}, ${part.item}, ${part.cost}, 
                ${part.store}, ${part.customStore}, NOW()
              )
            `;
          }
        }
        console.log('Transaction created by', user.username + ':', transaction.id);
        return res.status(201).json({
          data: mapTransaction(transaction),
          error: null,
          message: 'Transaction created successfully',
        });
      }
      case 'DELETE': {
        // Clear all transactions (admin only)
        if (user.role !== 'admin') {
          return res.status(403).json({ data: null, error: 'Admin access required' });
        }
        await sql`DELETE FROM expenditures`;
        await sql`DELETE FROM transactions`;
        console.log('Transactions cleared by admin');
        return res.status(200).json({ data: null, error: null, message: 'All transactions cleared' });
      }
      default:
        return res.status(405).json({ data: null, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Transactions API error:', error);
    return res.status(500).json({ data: null, error: error.message || 'Internal server error' });
  }
} 