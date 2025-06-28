"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.initializeDatabase = exports.createTables = void 0;
const serverless_1 = require("@neondatabase/serverless");
const sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
exports.sql = sql;
const createTables = async () => {
    await sql `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await sql `
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
    await sql `
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
    await sql `
    CREATE TABLE IF NOT EXISTS expenditures (
      id SERIAL PRIMARY KEY,
      recipient VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      remaining DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await sql `
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
    await sql `
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
    const adminExists = await sql `
    SELECT id FROM users WHERE username = 'admin' LIMIT 1
  `;
    if (adminExists.length === 0) {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await sql `
      INSERT INTO users (username, password_hash, role)
      VALUES ('admin', ${hashedPassword}, 'admin')
    `;
    }
};
exports.createTables = createTables;
const initializeDatabase = async () => {
    try {
        await (0, exports.createTables)();
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=database.js.map