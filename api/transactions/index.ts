import { sql } from '../../backend/lib/database.js';
import { authenticateToken } from '../../backend/lib/auth.js';

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
    const user = await authenticateToken(req as any);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.method === 'GET') {
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

      return res.status(200).json(transactions);
    }

    if (req.method === 'POST') {
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
        return res.status(400).json({ error: 'Missing required fields' });
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
        message: 'Transaction created successfully',
        transaction
      });
    }

    if (req.method === 'DELETE') {
      // Clear all transactions (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await sql`DELETE FROM expenditures`;
      await sql`DELETE FROM transactions`;

      console.log('Transactions cleared by admin');

      return res.status(200).json({ message: 'All transactions cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Transactions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 