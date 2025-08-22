import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { debugLog } from '../utils/debugLog'; // Import debugLog utility

interface AlertBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isVisible: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function AlertBanner({
  message,
  type = 'info',
  isVisible,
  onClose,
  autoHide = true,
  autoHideDelay = 5000,
}: AlertBannerProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    debugLog('AlertBanner', 'useEffect - isVisible changed', { isVisible });
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && autoHide) {
      debugLog('AlertBanner', 'useEffect - autoHide timer started', {
        autoHideDelay,
      });
      const timer = setTimeout(() => {
        setShow(false);
        debugLog('AlertBanner', 'useEffect - autoHide timer ended', {
          autoHideDelay,
        });
        onClose?.();
      }, autoHideDelay);

      return () => {
        debugLog('AlertBanner', 'useEffect - autoHide timer cleared');
        clearTimeout(timer);
      };
    }
  }, [show, autoHide, autoHideDelay, onClose]);

  const typeStyles = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4`}
        >
          <div
            className={`rounded-xl border p-4 backdrop-blur-sm ${typeStyles[type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{typeIcons[type]}</span>
              <p className="font-arabic flex-1 text-sm leading-relaxed">
                {message}
              </p>
              {onClose && (
                <button
                  onClick={() => {
                    debugLog('AlertBanner', 'onClose button clicked');
                    setShow(false);
                    onClose();
                  }}
                  className="text-white/60 hover:text-white transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
