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
      // Get all supplier payments
      const payments = await sql`
        SELECT * FROM supplier_payments
        ORDER BY created_at DESC
      `;

      return res.status(200).json(payments);
    }

    if (req.method === 'POST') {
      const { supplier, amount, paymentMethod, description } = req.body;

      if (!supplier || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Supplier, amount, and payment method are required' });
      }

      // Create supplier payment
      const newPayment = await sql`
        INSERT INTO supplier_payments (supplier, amount, payment_method, description, created_at)
        VALUES (${supplier}, ${amount}, ${paymentMethod}, ${description}, NOW())
        RETURNING *
      `;

      console.log('Payment recorded by', user.username + ':', newPayment[0].id);

      return res.status(201).json({
        message: 'Payment recorded successfully',
        payment: newPayment[0]
      });
    }

    if (req.method === 'DELETE') {
      // Clear all supplier payments (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await sql`DELETE FROM supplier_payments`;

      console.log('Supplier payments cleared by admin');

      return res.status(200).json({ message: 'All supplier payments cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Supplier payments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 