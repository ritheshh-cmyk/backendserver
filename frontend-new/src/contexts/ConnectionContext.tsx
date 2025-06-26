import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { socketUrl } from "@/lib/api";

interface ConnectionContextType {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncTime: Date | null;
  connect: () => void;
  disconnect: () => void;
  socket: Socket | null;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined,
);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current) return; // Already connected
    setIsConnecting(true);
    const socket = io(socketUrl, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsOnline(true);
      setIsConnecting(false);
      setLastSyncTime(new Date());
    });
    socket.on("disconnect", () => {
      setIsOnline(false);
    });
    socket.on("connect_error", () => {
      setIsOnline(false);
      setIsConnecting(false);
    });
    socket.on("sync", () => {
      setLastSyncTime(new Date());
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsOnline(false);
    setLastSyncTime(null);
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        isConnecting,
        lastSyncTime,
        connect,
        disconnect,
        socket: socketRef.current,
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
