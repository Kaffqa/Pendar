// src/components/ui/input.tsx
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600 bg-white'
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, rows = 4, ...props }: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full px-3 py-2 border rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600 bg-white'
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
