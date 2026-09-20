import Papa from 'papaparse';
import { enhancePatientRecord } from './riskEngine';
import { clearAllPatients, insertPatientsBatch } from './db';
import { PatientRecord } from '../types';

export interface ParseProgress {
  rowsProcessed: number;
  totalEstimated: number;
  percentage: number;
  currentPhase: 'parsing' | 'saving' | 'completed' | 'error';
  errorMessage?: string;
}

export async function parseAndImportCsvFile(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<{ totalImported: number; sampleHeaders: string[] }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Clear existing records before importing new full dataset
      await clearAllPatients();

      let rowCounter = 0;
      let batch: PatientRecord[] = [];
      const BATCH_SIZE = 2500;
      let detectedHeaders: string[] = [];
      const estimatedTotal = file.size > 0 ? Math.max(100, Math.round(file.size / 110)) : 55502;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        chunkSize: 1024 * 512, // 512KB streaming chunks
        chunk: async (results, parser) => {
          // Pause parser while writing batch to IndexedDB to prevent memory buildup
          parser.pause();

          if (detectedHeaders.length === 0 && results.meta.fields) {
            detectedHeaders = results.meta.fields;
          }

          const rawRows = results.data as any[];
          for (const raw of rawRows) {
            if (!raw || Object.keys(raw).length === 0) continue;
            // Check if row has at least some content
            const hasData = Object.values(raw).some(val => val !== null && val !== undefined && String(val).trim() !== '');
            if (!hasData) continue;

            const record = enhancePatientRecord(raw, rowCounter);
            batch.push(record);
            rowCounter++;

            if (batch.length >= BATCH_SIZE) {
              await insertPatientsBatch(batch);
              batch = [];
              if (onProgress) {
                const pct = Math.min(99, Math.round((rowCounter / estimatedTotal) * 100));
                onProgress({
                  rowsProcessed: rowCounter,
                  totalEstimated: estimatedTotal,
                  percentage: pct,
                  currentPhase: 'saving',
                });
              }
            }
          }

          // Resume parser for next chunk
          parser.resume();
        },
        complete: async () => {
          try {
            // Write remaining records in final batch
            if (batch.length > 0) {
              await insertPatientsBatch(batch);
              batch = [];
            }

            if (onProgress) {
              onProgress({
                rowsProcessed: rowCounter,
                totalEstimated: rowCounter,
                percentage: 100,
                currentPhase: 'completed',
              });
            }

            resolve({
              totalImported: rowCounter,
              sampleHeaders: detectedHeaders,
            });
          } catch (err: any) {
            reject(err);
          }
        },
        error: (error) => {
          if (onProgress) {
            onProgress({
              rowsProcessed: rowCounter,
              totalEstimated: estimatedTotal,
              percentage: 0,
              currentPhase: 'error',
              errorMessage: error.message,
            });
          }
          reject(error);
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}
