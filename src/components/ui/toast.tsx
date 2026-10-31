'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export function Toast({ type = 'info', message, onClose }: ToastProps) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    info: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  }[type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-sm text-xs ${styles}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-70 transition cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
