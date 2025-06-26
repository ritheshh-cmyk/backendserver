import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ConnectionContextType {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncTime: Date | null;
  connect: () => void;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined,
);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  useEffect(() => {
    // Simulate socket.io connection status
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen to browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Simulate periodic connection checks
    const connectionCheck = setInterval(() => {
      // Simulate random connection issues (5% chance)
      if (Math.random() < 0.05) {
        setIsOnline(false);
        setTimeout(() => {
          setIsOnline(true);
          setLastSyncTime(new Date());
        }, 3000);
      } else if (isOnline) {
        setLastSyncTime(new Date());
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(connectionCheck);
    };
  }, [isOnline]);

  const connect = async () => {
    setIsConnecting(true);
    // Simulate connection attempt
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsOnline(true);
    setIsConnecting(false);
    setLastSyncTime(new Date());
  };

  const disconnect = () => {
    setIsOnline(false);
    setLastSyncTime(null);
  };

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        isConnecting,
        lastSyncTime,
        connect,
        disconnect,
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

// Real-time socket.io status indicator component
export function ConnectionIndicator() {
  const { isOnline, isConnecting, lastSyncTime } = useConnection();
  const { t } = useLanguage();

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-warning">
        <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
        <span className="text-xs font-medium">{t("connecting")}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${isOnline ? "text-success" : "text-destructive"}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${isOnline ? "bg-success connection-pulse" : "bg-destructive"}`}
      />
      <span className="text-xs font-medium">
        {isOnline ? t("online") : t("offline")}
      </span>
      {lastSyncTime && isOnline && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          • Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Import useLanguage hook
import { useLanguage } from "./LanguageContext";
