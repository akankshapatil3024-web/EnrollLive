import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ParseProgress, parseAndImportCsvFile } from '../services/csvParser';
import { clearAllPatients, insertPatientsBatch } from '../services/db';
import { generateSyntheticPatients } from '../services/defaultData';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: () => void;
  currentCount: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
  currentCount,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMessage('Please upload a valid CSV file (e.g., v4u.csv).');
      return;
    }

    setIsProcessing(true);
    setProgress({
      rowsProcessed: 0,
      totalEstimated: 55502,
      percentage: 0,
      currentPhase: 'parsing',
    });
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await parseAndImportCsvFile(file, (p) => {
        setProgress(p);
      });

      setSuccessMessage(`Successfully imported and indexed ${result.totalImported.toLocaleString()} patient records into your browser database!`);
      onDataUpdated();
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Failed to parse and store CSV records.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleLoadSample = async (count: number) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgress({
      rowsProcessed: 0,
      totalEstimated: count,
      percentage: 5,
      currentPhase: 'saving',
    });

    try {
      await clearAllPatients();
      const CHUNK_SIZE = 5000;
      let inserted = 0;

      while (inserted < count) {
        const batchSize = Math.min(CHUNK_SIZE, count - inserted);
        const chunk = generateSyntheticPatients(batchSize, inserted);
        await insertPatientsBatch(chunk);
        inserted += batchSize;
        const pct = Math.round((inserted / count) * 100);
        setProgress({
          rowsProcessed: inserted,
          totalEstimated: count,
          percentage: pct,
          currentPhase: inserted >= count ? 'completed' : 'saving',
        });
        // brief pause to allow UI update
        await new Promise(r => setTimeout(r, 10));
      }

      setSuccessMessage(`Successfully seeded full ${count.toLocaleString()} patient dataset! All filters, pagination, and statistics are now active.`);
      onDataUpdated();
    } catch (err: any) {
      setErrorMessage('Failed to generate cohort: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all stored patient records from your browser database?')) {
      await clearAllPatients();
      onDataUpdated();
      setSuccessMessage('Database cleared. You can upload a new CSV or seed sample patients.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden" id="csv-import-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[min(92vh,680px)] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Healthcare Dataset Manager</h2>
              <p className="text-xs text-slate-500">
                Import <span className="font-mono text-slate-800 font-semibold">v4u.csv</span> (~55,502 records) or seed realistic cohorts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 table-scrollbar">
          {/* Architecture notice */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 leading-relaxed flex items-start gap-3">
            <Database className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <strong>High-Performance Browser Data Layer:</strong> Your records are parsed in streaming chunks and indexed locally in browser IndexedDB. Fast pagination, filtering, and risk calculation run on-device. Gemini never receives the full CSV; only single selected patient records are submitted for AI explanation.
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-sky-500 bg-sky-50/70 scale-[0.99]'
                : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag &amp; Drop <span className="text-sky-700">v4u.csv</span> here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              or click to browse your files (supports 55,502+ row CSVs)
            </p>
            <span className="inline-block mt-3 text-[11px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
              Standard Kaggle Healthcare CSV Schema
            </span>
          </div>

          {/* Progress Indicator */}
          {isProcessing && progress && (
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span>Processing &amp; Indexing Records...</span>
                </span>
                <span className="font-mono text-sky-700">
                  {progress.rowsProcessed.toLocaleString()} rows ({progress.percentage}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${progress.percentage}%` }}
                  className="h-full bg-sky-600 rounded-full transition-all duration-300"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Storing records in IndexedDB chunks to prevent browser freeze...
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pre-bundled Synthetic / Sample Data Generators */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Or Seed Built-In Datasets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleLoadSample(1200)}
                disabled={isProcessing}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Standard Cohort</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1,200 curated records
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample(10000)}
                disabled={isProcessing}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Database className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>10,000 Records</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  High-volume testing
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample(55502)}
                disabled={isProcessing}
                className="p-3 rounded-xl border-2 border-sky-300 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-500 text-left transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-900">
                  <Database className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  <span>Full 55,502 Dataset</span>
                </div>
                <p className="text-[11px] text-sky-700 mt-1">
                  v4u.csv scale benchmark
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Currently Loaded: <strong className="font-mono text-slate-800">{currentCount.toLocaleString()}</strong> patients</span>
          </div>

          <div className="flex items-center gap-3">
            {currentCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear DB</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
