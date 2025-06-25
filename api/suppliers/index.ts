import { sql } from '../../backend/lib/database.js';
import { authenticateToken } from '../../backend/lib/auth.js';

// Helper to map DB fields to frontend expectations
function mapSupplier(s: any) {
  return {
    id: s.id,
    name: s.name,
    contactPerson: s.contact, // Map contact -> contactPerson
    email: s.email || '', // Add email if available, else empty
    address: s.address,
    createdAt: s.created_at,
    totalPurchases: s.total_expenditure || 0, // Map total_expenditure -> totalPurchases
    totalPayments: s.total_payments || 0,
    outstandingAmount: s.due_amount || 0, // Map due_amount -> outstandingAmount
    status: s.status || 'active', // Default to active if not present
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
        // Get all suppliers with their due amounts
        const suppliers = await sql`
          SELECT 
            s.*, COALESCE(SUM(e.cost), 0) as total_expenditure,
            COALESCE(SUM(sp.amount), 0) as total_payments,
            COALESCE(SUM(e.cost), 0) - COALESCE(SUM(sp.amount), 0) as due_amount
          FROM suppliers s
          LEFT JOIN expenditures e ON s.name = e.store
          LEFT JOIN supplier_payments sp ON s.name = sp.supplier
          GROUP BY s.id, s.name, s.contact, s.address, s.created_at
          ORDER BY s.name
        `;
        return res.status(200).json({ data: suppliers.map(mapSupplier), error: null });
      }
      case 'POST': {
        const { name, contactPerson, address, email } = req.body;
        if (!name || !contactPerson) {
          return res.status(400).json({ data: null, error: 'Supplier name and contact person are required' });
        }
        // Check if supplier already exists
        const existingSuppliers = await sql`
          SELECT id FROM suppliers WHERE name = ${name}
        `;
        if (existingSuppliers.length > 0) {
          return res.status(400).json({ data: null, error: 'Supplier already exists' });
        }
        // Create supplier
        const newSupplier = await sql`
          INSERT INTO suppliers (name, contact, address, email, created_at)
          VALUES (${name}, ${contactPerson}, ${address}, ${email || ''}, NOW())
          RETURNING *
        `;
        return res.status(201).json({
          data: mapSupplier(newSupplier[0]),
          error: null,
          message: 'Supplier created successfully',
        });
      }
      case 'DELETE': {
        // Clear all suppliers (admin only)
        if (user.role !== 'admin') {
          return res.status(403).json({ data: null, error: 'Admin access required' });
        }
        await sql`DELETE FROM supplier_payments`;
        await sql`DELETE FROM suppliers`;
        return res.status(200).json({ data: null, error: null, message: 'All suppliers cleared' });
      }
      default:
        return res.status(405).json({ data: null, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ data: null, error: error.message || 'Internal server error' });
  }
} 