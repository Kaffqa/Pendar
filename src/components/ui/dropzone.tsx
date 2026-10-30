// src/components/ui/dropzone.tsx
'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck, X, AlertCircle } from 'lucide-react';

export interface DropzoneProps {
  label: string;
  description: string;
  required?: boolean;
  maxSizeMB?: number;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function Dropzone({
  label,
  description,
  required = true,
  maxSizeMB = 15,
  value,
  onChange,
  error,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setLocalError(null);

    // Hard-limit: Hanya berkas PDF yang diterima
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setLocalError('Format berkas tidak valid. Hanya berkas PDF (.pdf) yang diperbolehkan.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Ukuran berkas melebihi batas maksimal ${maxSizeMB} MB.`);
      return;
    }

    onChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const activeError = error || localError;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">Maks. {maxSizeMB} MB (PDF)</span>
      </div>

      <p className="text-xs text-slate-500">{description}</p>

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-600 bg-blue-50/50'
              : activeError
              ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-medium text-slate-700">
            Klik untuk memilih berkas atau seret PDF ke sini
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Format wajib: PDF asli</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{value.name}</p>
              <p className="text-[11px] text-slate-500">{formatFileSize(value.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setLocalError(null);
            }}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
            title="Hapus berkas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
