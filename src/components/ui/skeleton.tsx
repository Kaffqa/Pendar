// src/components/ui/skeleton.tsx
import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded ${className}`}
    />
  );
}
