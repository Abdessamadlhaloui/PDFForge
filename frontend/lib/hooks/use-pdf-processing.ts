'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { usePDFStore } from '@/lib/store';
import { toast } from 'sonner';
import type { ProcessingResult } from '@/lib/api';

async function downloadResult(result: ProcessingResult): Promise<void> {
  try {
    const blob = await api.downloadFile(result.file_id);
    api.triggerBrowserDownload(blob, result.filename);
  } catch {
    const url = api.getFullDownloadURL(result.download_url);
    window.open(url, '_blank');
  }
}

export function useMergePDFs() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: (files: File[]) => api.mergePDFs(files),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast.success('PDFs merged successfully!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to merge PDFs';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useSplitPDF() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: ({ file, ranges }: { file: File; ranges: string }) =>
      api.splitPDF(file, ranges),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast.success('PDF split successfully!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to split PDF';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useCompressPDF() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      quality,
    }: {
      file: File;
      quality: 'screen' | 'ebook' | 'printer' | 'prepress';
    }) => api.compressPDF(file, quality),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      const reduction = (data.metadata as Record<string, unknown>)
        ?.reduction_percent;
      toast.success(
        `PDF compressed! Size reduced by ${reduction ?? '?'}%`,
      );
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to compress PDF';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useRotatePDF() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      pages,
      angle,
    }: {
      file: File;
      pages: number[];
      angle: number;
    }) => api.rotatePDF(file, pages, angle),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast.success('PDF pages rotated!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to rotate PDF';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useAddWatermark() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      text,
      options,
    }: {
      file: File;
      text: string;
      options?: {
        position?: string;
        opacity?: number;
        font_size?: number;
        color?: string;
        rotation?: number;
      };
    }) => api.addWatermark(file, text, options),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast.success('Watermark added!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to add watermark';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useConvertPDF() {
  const { setIsLoading, setError, setLastResult } = usePDFStore();

  return useMutation({
    mutationFn: async ({
      file,
      format,
      dpi,
      quality,
    }: {
      file: File;
      format: string;
      dpi?: number;
      quality?: number;
    }) => {
      switch (format) {
        case 'docx':
          return api.pdfToWord(file);
        case 'xlsx':
          return api.pdfToExcel(file);
        case 'pptx':
          return api.pdfToPptx(file);
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'webp':
        case 'tiff':
          return api.pdfToImages(file, format, dpi, quality);
        default:
          return api.pdfToImages(file, 'png', dpi, quality);
      }
    },
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast.success('PDF converted successfully!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to convert PDF';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useSummarizePDF() {
  const { setIsLoading, setError } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      maxLength,
      minLength,
    }: {
      file: File;
      maxLength?: number;
      minLength?: number;
    }) => api.summarizePDF(file, maxLength, minLength),
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: () => {
      toast.success('Summary generated!');
      setIsLoading(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Summarization failed';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useChatWithPDF() {
  const { setIsLoading, setError } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      question,
      contextWindow,
    }: {
      file: File;
      question: string;
      contextWindow?: number;
    }) => api.chatWithPDF(file, question, contextWindow),
    onMutate: () => setIsLoading(true),
    onSuccess: () => setIsLoading(false),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Chat failed';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useSearchPDF() {
  const { setIsLoading, setError } = usePDFStore();

  return useMutation({
    mutationFn: ({
      file,
      query,
      topK,
    }: {
      file: File;
      query: string;
      topK?: number;
    }) => api.searchPDF(file, query, topK),
    onMutate: () => setIsLoading(true),
    onSuccess: () => setIsLoading(false),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Search failed';
      toast.error(message);
      setError(message);
      setIsLoading(false);
    },
  });
}

export function useDownloadResult() {
  return useMutation({
    mutationFn: (result: ProcessingResult) => downloadResult(result),
    onSuccess: () => toast.success('Download started!'),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Download failed';
      toast.error(message);
    },
  });
}

export function useHealthCheck() {
  const { setBackendOnline } = usePDFStore();

  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const health = await api.checkHealth();
        setBackendOnline(true);
        return health;
      } catch {
        setBackendOnline(false);
        throw new Error('Backend is offline');
      }
    },
    refetchInterval: 30000,
    retry: false,
  });
}

export function useTaskStatus(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.getTaskStatus(taskId),
    refetchInterval: 1000,
    enabled: !!taskId,
  });
}

export function usePDFMetadata() {
  const { setIsLoading, setError } = usePDFStore();

  return useMutation({
    mutationFn: (file: File) => api.getPDFMetadata(file),
    onMutate: () => setIsLoading(true),
    onSuccess: () => setIsLoading(false),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to get metadata';
      setError(message);
      setIsLoading(false);
    },
  });
}
