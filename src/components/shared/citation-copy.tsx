// src/components/shared/citation-copy.tsx
'use client';

import React, { useState } from 'react';
import { Copy, Check, Quote } from 'lucide-react';

export interface CitationProps {
  title: string;
  authorName: string;
  journalName: string;
  year: number;
  volume: number;
  issue: number;
  articleId: string;
}

export function CitationCopy({
  title,
  authorName,
  journalName,
  year,
  volume,
  issue,
  articleId,
}: CitationProps) {
  const [activeFormat, setActiveFormat] = useState<'apa' | 'ieee' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);

  // 1. Format APA (7th Edition)
  const apaCitation = `${authorName}. (${year}). ${title}. ${journalName}, ${volume}(${issue}).`;

  // 2. Format IEEE
  const ieeeCitation = `${authorName}, "${title}," ${journalName}, vol. ${volume}, no. ${issue}, ${year}.`;

  // 3. Format BibTeX
  const citeKey = `${authorName.split(' ').pop()?.toLowerCase() || 'pendar'}${year}`;
  const bibtexCitation = `@article{${citeKey},
  title = {${title}},
  author = {${authorName}},
  journal = {${journalName}},
  volume = {${volume}},
  number = {${issue}},
  year = {${year}}
}`;

  const currentCitation =
    activeFormat === 'apa'
      ? apaCitation
      : activeFormat === 'ieee'
      ? ieeeCitation
      : bibtexCitation;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCitation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Gagal menyalin teks sitasi.');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Quote className="w-4 h-4 text-blue-600" />
          <span>Format Sitasi Ilmiah</span>
        </div>

        {/* Tab Pilihan Format */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFormat('apa')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeFormat === 'apa'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            APA
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('ieee')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeFormat === 'ieee'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            IEEE
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('bibtex')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeFormat === 'bibtex'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            BibTeX
          </button>
        </div>
      </div>

      {/* Konten Sitasi */}
      <div className="relative bg-white border border-slate-200 rounded p-3">
        <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap break-words leading-relaxed select-all">
          {currentCitation}
        </pre>

        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
