import type { Transaction, SupplierPayment } from './types';
import { config } from './config';

// Shared API utility for all platforms
const BASE_URL = config.API_BASE_URL;

export async function createTransaction(transaction: Transaction) {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return res.json();
}

export async function getSupplierSummary() {
  const res = await fetch(`${BASE_URL}/expenditures/supplier-summary`);
  return res.json();
}

export async function createSupplierPayment(payment: SupplierPayment) {
  const res = await fetch(`${BASE_URL}/expenditures/supplier-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  return res.json();
}

// --- Authentication API ---
export async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
}

export async function register(username: string, password: string, role: string = 'user', token?: string) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username, password, role }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
  return res.json();
}

// --- E-Bill API ---
export interface BillItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface BillData {
  customerName: string;
  mobile: string;
  items: BillItem[];
  total: number;
  billNumber?: string;
}

export interface Bill {
  id: number;
  customerName: string;
  mobile: string;
  total: number;
  billNumber: string;
  pdfBase64: string;
  html: string;
  createdAt: string;
}

export async function generateBill(billData: BillData, token: string): Promise<{ success: boolean; bill: Bill }> {
  const res = await fetch(`${BASE_URL}/bills/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(billData),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to generate bill');
  return res.json();
}

export async function getBill(id: number, token: string): Promise<Bill> {
  const res = await fetch(`${BASE_URL}/bills/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch bill');
  return res.json();
}

export async function getAllBills(token: string): Promise<Omit<Bill, 'pdfBase64' | 'html'>[]> {
  const res = await fetch(`${BASE_URL}/bills`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch bills');
  return res.json();
}

// --- SMS API ---
export interface SMSData {
  mobile: string;
  message: string;
}

export async function sendSMS(smsData: SMSData, token: string): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`${BASE_URL}/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(smsData),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to send SMS');
  return res.json();
}

// Add more API functions as needed 