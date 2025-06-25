import { sql } from '../../backend/lib/database.js';
import { authenticateToken } from '../../backend/lib/auth.js';

// Helper to map DB fields to frontend expectations
function mapPayment(p: any) {
  return {
    id: p.id,
    supplier: p.supplier,
    amount: p.amount,
    paymentMethod: p.payment_method,
    description: p.description || '',
    createdAt: p.created_at,
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
        // Get all supplier payments
        const payments = await sql`
          SELECT * FROM supplier_payments
          ORDER BY created_at DESC
        `;
        return res.status(200).json({ data: payments.map(mapPayment), error: null });
      }
      case 'POST': {
        const { supplier, amount, paymentMethod, description } = req.body;
        if (!supplier || !amount || !paymentMethod) {
          return res.status(400).json({ data: null, error: 'Supplier, amount, and payment method are required' });
        }
        // Create supplier payment
        const newPayment = await sql`
          INSERT INTO supplier_payments (supplier, amount, payment_method, description, created_at)
          VALUES (${supplier}, ${amount}, ${paymentMethod}, ${description || ''}, NOW())
          RETURNING *
        `;
        console.log('Payment recorded by', user.username + ':', newPayment[0].id);
        return res.status(201).json({
          data: mapPayment(newPayment[0]),
          error: null,
          message: 'Payment recorded successfully',
        });
      }
      case 'DELETE': {
        // Clear all supplier payments (admin only)
        if (user.role !== 'admin') {
          return res.status(403).json({ data: null, error: 'Admin access required' });
        }
        await sql`DELETE FROM supplier_payments`;
        console.log('Supplier payments cleared by admin');
        return res.status(200).json({ data: null, error: null, message: 'All supplier payments cleared' });
      }
      default:
        return res.status(405).json({ data: null, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Supplier payments API error:', error);
    return res.status(500).json({ data: null, error: error.message || 'Internal server error' });
  }
} 