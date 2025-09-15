import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AlertType = "success" | "error" | "info";

export function Alert({
  type = "info",
  message,
  onClose,
  autoCloseMs = 3500,
}: {
  type?: AlertType;
  message: string;
  onClose?: () => void;
  autoCloseMs?: number;
}) {
  useEffect(() => {
    if (!onClose || !autoCloseMs) return;
    const id = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(id);
  }, [onClose, autoCloseMs]);

  const getAlertStyles = (alertType: "success" | "error" | "info") => {
    switch (alertType) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getAlertIcon = (alertType: "success" | "error" | "info") => {
    switch (alertType) {
      case "success":
        return "✅";
      case "error":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const style = getAlertStyles(type);
  const icon = getAlertIcon(type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={`mb-4 p-3 rounded-lg border flex items-start gap-2 ${style}`}
        role="status"
        aria-live="polite"
      >
        <span className="select-none" aria-hidden>
          {icon}
        </span>
        <span className="text-sm">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto px-2 text-current/70 hover:text-current transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
