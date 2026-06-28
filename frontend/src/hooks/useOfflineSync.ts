import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import toast from 'react-hot-toast';

interface OfflineQueueItem {
  id: string;
  documentId: string;
  update: number[]; // Array representation of Uint8Array for Yjs
  timestamp: number;
}

export function useOfflineSync(documentId: string, isConnected: boolean, sendChanges: (changes: any) => void) {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [queueSize, setQueueSize] = useState(0);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update queue size metric
  const updateQueueSize = useCallback(async () => {
    try {
      const queue: OfflineQueueItem[] = (await localforage.getItem(`offline_queue_${documentId}`)) || [];
      setQueueSize(queue.length);
    } catch (e) {
      console.error('Failed to get queue size', e);
    }
  }, [documentId]);

  useEffect(() => {
    updateQueueSize();
  }, [updateQueueSize]);

  // Queue a change when offline
  const queueChange = async (update: Uint8Array) => {
    try {
      const queue: OfflineQueueItem[] = (await localforage.getItem(`offline_queue_${documentId}`)) || [];
      queue.push({
        id: Math.random().toString(36).substring(7),
        documentId,
        update: Array.from(update),
        timestamp: Date.now(),
      });
      await localforage.setItem(`offline_queue_${documentId}`, queue);
      setQueueSize(queue.length);
    } catch (e) {
      console.error('Failed to queue change', e);
    }
  };

  // Flush the queue when reconnected
  useEffect(() => {
    const flushQueue = async () => {
      if (isConnected && isOnline) {
        try {
          const queue: OfflineQueueItem[] = (await localforage.getItem(`offline_queue_${documentId}`)) || [];
          if (queue.length > 0) {
            toast.success(`Syncing ${queue.length} offline changes...`);
            
            // Replay all changes in the queue sequentially
            for (const item of queue) {
              sendChanges(item.update);
            }
            
            // Clear the queue after successful transmission
            await localforage.removeItem(`offline_queue_${documentId}`);
            setQueueSize(0);
          }
        } catch (e) {
          console.error('Failed to flush offline queue', e);
          toast.error('Failed to sync offline changes');
        }
      }
    };

    flushQueue();
  }, [isConnected, isOnline, documentId, sendChanges]);

  return {
    isOnline,
    queueSize,
    queueChange,
  };
}
