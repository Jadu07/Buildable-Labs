import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';

interface UseRealtimeProps {
  documentId: string;
  token: string | null;
}

export function useRealtime({ documentId, token }: UseRealtimeProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join-document', documentId);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      s.emit('leave-document', documentId);
      s.disconnect();
      socketRef.current = null;
    };
  }, [documentId, token]);

  const sendChanges = useCallback((changes: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-changes', changes);
    }
  }, []);

  return { isConnected, sendChanges, socket };
}
