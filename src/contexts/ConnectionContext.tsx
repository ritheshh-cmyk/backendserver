import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiClient } from "../lib/api";

interface ConnectionContextType {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncTime: Date | null;
  backendURL: string;
  connect: () => void;
  disconnect: () => void;
  updateBackendURL: (url: string) => void;
  healthCheck: () => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined,
);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [backendURL, setBackendURL] = useState<string>('');

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    setIsConnecting(true);
    
    try {
      // Get initial backend URL
      const status = apiClient.getConnectionStatus();
      setBackendURL(status.baseURL);
      
      // Perform initial health check
      await healthCheck();
      
    } catch (error) {
      console.error('Failed to initialize connection:', error);
      setIsOnline(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const healthCheck = async (): Promise<boolean> => {
    try {
      const response = await apiClient.ping();
      setIsOnline(true);
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      setIsOnline(false);
      return false;
    }
  };

  // Periodic health checks
  useEffect(() => {
    if (!isConnecting) {
      const interval = setInterval(async () => {
        await healthCheck();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Browser went online, checking backend...');
      await healthCheck();
    };

    const handleOffline = () => {
      console.log('Browser went offline');
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const success = await healthCheck();
      if (success) {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsOnline(false);
    setLastSyncTime(null);
  };

  const updateBackendURL = (url: string) => {
    apiClient.updateBackendURL(url);
    setBackendURL(url);
    // Test the new URL
    connect();
  };

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        isConnecting,
        lastSyncTime,
        backendURL,
        connect,
        disconnect,
        updateBackendURL,
        healthCheck,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}

// Real-time connection status indicator component
export function ConnectionIndicator() {
  const { isOnline, isConnecting, lastSyncTime, backendURL } = useConnection();

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
        <span className="text-xs font-medium">Connecting...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${isOnline ? "text-green-600" : "text-red-600"}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-600 animate-pulse" : "bg-red-600"}`}
      />
      <span className="text-xs font-medium">
        {isOnline ? "Online" : "Offline"}
      </span>
      {lastSyncTime && isOnline && (
        <span className="text-xs text-gray-500 hidden sm:inline">
          • Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
      <span className="text-xs text-gray-400 hidden md:inline">
        • {backendURL}
      </span>
    </div>
  );
}
