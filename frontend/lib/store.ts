import { create } from 'zustand';
import type { ProcessingResult } from '@/lib/api';

export type PDFTool =
  | 'compress'
  | 'merge'
  | 'split'
  | 'convert'
  | 'edit'
  | 'sign'
  | 'watermark'
  | 'rotate'
  | 'redact'
  | 'ocr'
  | 'protect'
  | 'unlock'
  | 'extract-text'
  | 'extract-images'
  | 'ai-chat'
  | 'ai-summarize'
  | 'ai-translate'
  | 'ai-search';

export interface PDFFile {
  id: string;
  name: string;
  size: number;
  file: File;
  uploadedAt: Date;
  pages?: number;
}

export interface ProcessingJob {
  id: string;
  tool: PDFTool;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: ProcessingResult;
}

interface PDFStore {
  files: PDFFile[];
  addFile: (file: File) => void;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  getFileById: (id: string) => PDFFile | undefined;

  currentTool: PDFTool | null;
  setCurrentTool: (tool: PDFTool | null) => void;

  jobs: ProcessingJob[];
  addJob: (job: Omit<ProcessingJob, 'status' | 'progress'>) => string;
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (id: string) => void;
  clearJobs: () => void;

  lastResult: ProcessingResult | null;
  setLastResult: (result: ProcessingResult | null) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  backendOnline: boolean;
  setBackendOnline: (online: boolean) => void;
}

export const usePDFStore = create<PDFStore>((set, get) => ({
  files: [],

  addFile: (file: File) => {
    set((state) => ({
      files: [
        ...state.files,
        {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          file,
          uploadedAt: new Date(),
        },
      ],
    }));
  },

  addFiles: (files: File[]) => {
    const newFiles: PDFFile[] = files.map((file, i) => ({
      id: `file-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      file,
      uploadedAt: new Date(),
    }));
    set((state) => ({ files: [...state.files, ...newFiles] }));
  },

  removeFile: (id: string) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }));
  },

  clearFiles: () => set({ files: [] }),

  getFileById: (id: string) => {
    return get().files.find((f) => f.id === id);
  },

  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),

  jobs: [],

  addJob: (job) => {
    const fullJob: ProcessingJob = {
      ...job,
      status: 'pending',
      progress: 0,
    };
    set((state) => ({ jobs: [...state.jobs, fullJob] }));
    return fullJob.id;
  },

  updateJob: (id, updates) => {
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }));
  },

  removeJob: (id: string) => {
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
    }));
  },

  clearJobs: () => set({ jobs: [] }),

  lastResult: null,
  setLastResult: (result) => set({ lastResult: result }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  backendOnline: false,
  setBackendOnline: (online) => set({ backendOnline: online }),
}));
