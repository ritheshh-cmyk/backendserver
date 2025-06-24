import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Database schema
export const createTables = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(20) NOT NULL,
      device_model VARCHAR(255) NOT NULL,
      repair_type VARCHAR(255) NOT NULL,
      repair_cost DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      amount_given DECIMAL(10,2) NOT NULL,
      change_returned DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      remarks TEXT,
      parts_cost JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      contact VARCHAR(255),
      address TEXT,
      total_due DECIMAL(10,2) DEFAULT 0,
      total_remaining DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenditures (
      id SERIAL PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      remaining DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      supplier VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(20) NOT NULL,
      device_model VARCHAR(255) NOT NULL,
      repair_type VARCHAR(255) NOT NULL,
      repair_cost DECIMAL(10,2) NOT NULL,
      parts_cost JSONB,
      total_amount DECIMAL(10,2) NOT NULL,
      bill_number VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'generated',
      pdf_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id)
    )
  `;

  // Create default admin user if not exists
  const adminExists = await sql`
    SELECT id FROM users WHERE username = 'admin' LIMIT 1
  `;

  if (adminExists.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES ('admin', ${hashedPassword}, 'admin')
    `;
  }
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    await createTables();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

export { sql }; 