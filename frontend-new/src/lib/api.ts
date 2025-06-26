// API Configuration for Mobile Repair Tracker
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backendmobile-4swg.onrender.com';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://backendmobile-4swg.onrender.com';

// API Client with authentication
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(username: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Transactions
  async getTransactions() {
    return this.request('/api/transactions');
  }

  async createTransaction(data: any) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getTodayStats() {
    return this.request('/api/stats/today');
  }

  // Suppliers
  async getSuppliers() {
    return this.request('/api/suppliers');
  }

  async createSupplier(data: any) {
    return this.request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: string, data: any) {
    return this.request(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string) {
    return this.request(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // Bills
  async getBills() {
    return this.request('/api/bills');
  }

  async createBill(data: any) {
    return this.request('/api/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export socket URL for Socket.IO
export const socketUrl = SOCKET_URL;

// Export types
export interface Transaction {
  id: string;
  customerName: string;
  phoneNumber: string;
  deviceType: string;
  problem: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  totalDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface Stats {
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
  todayRevenue: number;
  todayTransactions: number;
} 