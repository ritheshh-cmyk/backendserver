import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:5000';

export function useSocketEvents({
  onTransactionCreated,
  onSupplierPaymentCreated,
  onDataCleared,
}: {
  onTransactionCreated?: (transaction: any) => void;
  onSupplierPaymentCreated?: (payment: any) => void;
  onDataCleared?: (info: { type: string }) => void;
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    if (onTransactionCreated) {
      socket.on('transactionCreated', onTransactionCreated);
    }
    if (onSupplierPaymentCreated) {
      socket.on('supplierPaymentCreated', onSupplierPaymentCreated);
    }
    if (onDataCleared) {
      socket.on('dataCleared', onDataCleared);
    }

    return () => {
      socket.disconnect();
    };
  }, [onTransactionCreated, onSupplierPaymentCreated, onDataCleared]);
} 