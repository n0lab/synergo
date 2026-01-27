// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { TOAST_DURATION } from '../constants.js';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    // Use crypto.randomUUID for better ID generation
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Accessible toast container with ARIA live region */}
      <div
        className="toast-container"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => {
          const IconComponent = toastIcons[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.type} toast-show glass`}
              onClick={() => removeToast(toast.id)}
              role="status"
              aria-live="polite"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  removeToast(toast.id);
                }
              }}
            >
              <span className="toast-icon" aria-hidden="true">
                <IconComponent size={20} />
              </span>
              <span className="toast-message">{toast.message}</span>
              <button
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
              <div className="toast-progress">
                <div
                  className="toast-progress-bar"
                  style={{
                    animationDuration: `${toast.duration}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
