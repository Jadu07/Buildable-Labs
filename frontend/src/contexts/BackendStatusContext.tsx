'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { checkBackendHealth } from '../utils/healthCheck';

interface BackendStatusContextType {
  online: boolean;
  loading: boolean;
  retries: number;
  elapsedTime: number; // in seconds
  retry: () => void;
}

const BackendStatusContext = createContext<BackendStatusContextType | undefined>(undefined);

export const BackendStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startPolling = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const poll = async () => {
      const isHealthy = await checkBackendHealth(abortControllerRef.current?.signal);
      if (isHealthy) {
        setOnline(true);
        setLoading(false);
        stopTimers();
      } else {
        setRetries(r => r + 1);
        pollingRef.current = setTimeout(poll, 2000);
      }
    };

    poll();
  }, []);

  const stopTimers = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setOnline(false);
    setRetries(0);
    startTimer();
    startPolling();
  }, [startPolling, startTimer]);

  useEffect(() => {
    retry();
    return () => {
      stopTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [retry]);

  return (
    <BackendStatusContext.Provider value={{ online, loading, retries, elapsedTime, retry }}>
      {children}
    </BackendStatusContext.Provider>
  );
};

export const useBackendStatus = () => {
  const context = useContext(BackendStatusContext);
  if (context === undefined) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider');
  }
  return context;
};
