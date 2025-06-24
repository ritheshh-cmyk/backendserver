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
      // Get all suppliers with their due amounts
      const suppliers = await sql`
        SELECT 
          s.*,
          COALESCE(SUM(e.cost), 0) as total_expenditure,
          COALESCE(SUM(sp.amount), 0) as total_payments,
          COALESCE(SUM(e.cost), 0) - COALESCE(SUM(sp.amount), 0) as due_amount
        FROM suppliers s
        LEFT JOIN expenditures e ON s.name = e.store
        LEFT JOIN supplier_payments sp ON s.name = sp.supplier
        GROUP BY s.id, s.name, s.contact, s.address, s.created_at
        ORDER BY s.name
      `;

      return res.status(200).json(suppliers);
    }

    if (req.method === 'POST') {
      const { name, contact, address } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Supplier name is required' });
      }

      // Check if supplier already exists
      const existingSuppliers = await sql`
        SELECT id FROM suppliers WHERE name = ${name}
      `;

      if (existingSuppliers.length > 0) {
        return res.status(400).json({ error: 'Supplier already exists' });
      }

      // Create supplier
      const newSupplier = await sql`
        INSERT INTO suppliers (name, contact, address, created_at)
        VALUES (${name}, ${contact}, ${address}, NOW())
        RETURNING *
      `;

      return res.status(201).json({
        message: 'Supplier created successfully',
        supplier: newSupplier[0]
      });
    }

    if (req.method === 'DELETE') {
      // Clear all suppliers (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await sql`DELETE FROM supplier_payments`;
      await sql`DELETE FROM suppliers`;

      return res.status(200).json({ message: 'All suppliers cleared' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 