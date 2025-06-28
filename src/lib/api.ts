// API Client for Ubuntu-in-Termux Backend
// Optimized for mobile devices and local network connections

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

class ApiClient {
  private config: ApiConfig;
  private isOnline: boolean = true;
  private retryCount: number = 0;

  constructor() {
    this.config = {
      baseURL: this.detectBackendURL(),
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
    };
  }

  private detectBackendURL(): string {
    // Auto-detect backend URL based on environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // If running on localhost, try common backend ports
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Try port 10000 first (Ubuntu-in-Termux default)
        return `http://${hostname}:10000`;
      }
      
      // If running on mobile device, try local network
      if (hostname.includes('192.168.') || hostname.includes('10.0.')) {
        return `http://${hostname}:10000`;
      }
      
      // Default to current host with backend port
      return `http://${hostname}:${port || '10000'}`;
    }
    
    return 'http://localhost:10000';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt: number = 0
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.isOnline = true;
      this.retryCount = 0;
      return data;

    } catch (error) {
      this.isOnline = false;
      
      // Retry logic for network errors
      if (retryAttempt < this.config.retries && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * (retryAttempt + 1));
        return this.makeRequest<T>(endpoint, options, retryAttempt + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'AbortError') return true;
    if (error.message?.includes('Failed to fetch')) return true;
    if (error.message?.includes('NetworkError')) return true;
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async ping(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('/api/ping');
  }

  // Connection status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      baseURL: this.config.baseURL,
      retryCount: this.retryCount,
    };
  }

  // Update backend URL (for dynamic discovery)
  updateBackendURL(newURL: string) {
    this.config.baseURL = newURL;
  }

  // Transactions API
  async getTransactions() {
    return this.makeRequest('/api/transactions');
  }

  async createTransaction(data: any) {
    return this.makeRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.makeRequest(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.makeRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Suppliers API
  async getSuppliers() {
    return this.makeRequest('/api/suppliers');
  }

  async createSupplier(data: any) {
    return this.makeRequest('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: string, data: any) {
    return this.makeRequest(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string) {
    return this.makeRequest(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory API
  async getInventory() {
    return this.makeRequest('/api/inventory');
  }

  async createInventoryItem(data: any) {
    return this.makeRequest('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: string, data: any) {
    return this.makeRequest(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.makeRequest(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports API
  async getReports() {
    return this.makeRequest('/api/reports');
  }

  async generateReport(type: string, params: any = {}) {
    return this.makeRequest(`/api/reports/${type}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Settings API
  async getSettings() {
    return this.makeRequest('/api/settings');
  }

  async updateSettings(data: any) {
    return this.makeRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Backup/Restore API
  async backupData() {
    return this.makeRequest('/api/backup', {
      method: 'POST',
    });
  }

  async restoreData(data: any) {
    return this.makeRequest('/api/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // System Status API
  async getSystemStatus() {
    return this.makeRequest('/api/system/status');
  }

  async getSystemLogs() {
    return this.makeRequest('/api/system/logs');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export default apiClient; 