'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { Loader2, Check } from 'lucide-react';
import { API_URL } from '../../constants/api';

interface Props {
  className?: string;
}

export const MinimalBackendStatus: React.FC<Props> = ({ className = '' }) => {
  const { online, loading } = useBackendStatus();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (online) {
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    } else {
      setShow(true);
    }
  }, [online]);

  const backendUrl = API_URL.replace(/\/api\/?$/, '');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center text-[12px] font-medium tracking-wide pointer-events-auto ${className}`}
        >
          <a 
            href={backendUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            title="Click to view live status of backend"
            className="flex items-center space-x-2 w-full h-full"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Loader2 className="w-3.5 h-3.5 opacity-70" />
              </motion.div>
            ) : (
              <Check className="w-3.5 h-3.5 opacity-70" />
            )}
            <span className="opacity-80 hover:underline">
              {online ? 'Backend OK' : 'Backend starting...'}
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
