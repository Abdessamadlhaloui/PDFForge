const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const API_V1 = `${API_BASE}/api/v1`;

export interface ProcessingResult {
  success: boolean;
  message: string;
  file_id: string;
  filename: string;
  original_size: number;
  processed_size: number;
  download_url: string;
  expires_at: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result: ProcessingResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  services: Record<string, string>;
  uptime_seconds: number;
}

export interface PDFMetadata {
  filename: string;
  page_count: number;
  file_size: number;
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  creation_date: string | null;
  modification_date: string | null;
  is_encrypted: boolean;
  has_text: boolean;
}

export interface SummarizeResponse {
  success: boolean;
  summary: string;
  word_count: number;
  page_count: number;
  language: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Array<{ page: number; text: string; relevance: number }>;
  confidence: number;
}

export interface SearchResponse {
  success: boolean;
  results: Array<{ page: number; text: string; score: number }>;
  total_matches: number;
}

export interface TextExtractionResponse {
  success: boolean;
  text: string;
  character_count: number;
  word_count: number;
}

export interface APIError {
  success: false;
  error: string;
  message: string;
  detail?: string;
}

class PDFForgeAPIError extends Error {
  constructor(
    public statusCode: number,
    public errorBody: APIError | string,
  ) {
    let msg = 'Unknown API error';
    if (typeof errorBody === 'string') {
        msg = errorBody;
    } else if (errorBody) {
        if (errorBody.detail) {
            msg = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
        } else if (errorBody.message) {
            msg = typeof errorBody.message === 'string' ? errorBody.message : (errorBody.message as any).message || JSON.stringify(errorBody.message);
        } else if (errorBody.error) {
            msg = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
        } else {
            msg = JSON.stringify(errorBody);
        }
    }
    super(msg);
    this.name = 'PDFForgeAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const textStr = await response.text();
    let errorBody: APIError | string;
    try {
      errorBody = JSON.parse(textStr);
    } catch {
      errorBody = textStr;
    }
    throw new PDFForgeAPIError(response.status, errorBody);
  }
  return response.json();
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_V1}/health`);
  return handleResponse<HealthResponse>(response);
}

export async function mergePDFs(files: File[]): Promise<ProcessingResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_V1}/pdf/merge`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function splitPDF(
  file: File,
  ranges: string,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ranges', ranges);

  const response = await fetch(`${API_V1}/pdf/split`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function compressPDF(
  file: File,
  quality: 'screen' | 'ebook' | 'printer' | 'prepress' = 'ebook',
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('quality', quality);

  const response = await fetch(`${API_V1}/pdf/compress`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function rotatePDF(
  file: File,
  pages: number[],
  angle: number = 90,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pages', pages.join(','));
  formData.append('angle', angle.toString());

  const response = await fetch(`${API_V1}/pdf/rotate`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function deletePages(
  file: File,
  pages: number[],
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pages', pages.join(','));

  const response = await fetch(`${API_V1}/pdf/delete-pages`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function reorderPages(
  file: File,
  pageOrder: number[],
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_order', pageOrder.join(','));

  const response = await fetch(`${API_V1}/pdf/reorder`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function extractPages(
  file: File,
  startPage: number,
  endPage: number,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('start_page', startPage.toString());
  formData.append('end_page', endPage.toString());

  const response = await fetch(`${API_V1}/pdf/extract-pages`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function addWatermark(
  file: File,
  text: string,
  options: {
    position?: string;
    opacity?: number;
    font_size?: number;
    color?: string;
    rotation?: number;
  } = {},
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('text', text);
  if (options.position) formData.append('position', options.position);
  if (options.opacity !== undefined)
    formData.append('opacity', options.opacity.toString());
  if (options.font_size !== undefined)
    formData.append('font_size', options.font_size.toString());
  if (options.color) formData.append('color', options.color);
  if (options.rotation !== undefined)
    formData.append('rotation', options.rotation.toString());

  const response = await fetch(`${API_V1}/pdf/add-watermark`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function protectPDF(
  file: File,
  userPassword: string,
  ownerPassword?: string,
  allowPrinting: boolean = true,
  allowCopying: boolean = false,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_password', userPassword);
  if (ownerPassword) formData.append('owner_password', ownerPassword);
  formData.append('allow_printing', allowPrinting.toString());
  formData.append('allow_copying', allowCopying.toString());

  const response = await fetch(`${API_V1}/pdf/protect`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function unlockPDF(
  file: File,
  password: string,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const response = await fetch(`${API_V1}/pdf/unlock`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function redactPDF(
  file: File,
  searchTerms: string[],
  redactColor: string = '#000000',
  useRegex: boolean = false,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('search_terms', searchTerms.join(','));
  formData.append('redact_color', redactColor);
  formData.append('use_regex', useRegex.toString());

  const response = await fetch(`${API_V1}/pdf/redact`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function ocrPDF(
  file: File,
  languages: string = 'eng',
  dpi: number = 300,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('languages', languages);
  formData.append('dpi', dpi.toString());

  const response = await fetch(`${API_V1}/pdf/ocr`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function extractText(
  file: File,
  pages?: number[],
  layout: boolean = false,
): Promise<TextExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (pages) formData.append('pages', pages.join(','));
  formData.append('layout', layout.toString());

  const response = await fetch(`${API_V1}/pdf/extract-text`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<TextExtractionResponse>(response);
}

export async function extractImages(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/pdf/extract-images`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function getPDFMetadata(file: File): Promise<PDFMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/pdf/metadata`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<PDFMetadata>(response);
}

export async function pdfToWord(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/pdf-to-word`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function pdfToExcel(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/pdf-to-excel`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function pdfToPptx(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/pdf-to-pptx`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function pdfToImages(
  file: File,
  format: string = 'png',
  dpi: number = 200,
  quality: number = 85,
): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  formData.append('dpi', dpi.toString());
  formData.append('quality', quality.toString());

  const response = await fetch(`${API_V1}/convert/pdf-to-images`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function wordToPDF(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/word-to-pdf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function excelToPDF(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/excel-to-pdf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function pptxToPDF(file: File): Promise<ProcessingResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_V1}/convert/pptx-to-pdf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function imagesToPDF(files: File[]): Promise<ProcessingResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_V1}/convert/images-to-pdf`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessingResult>(response);
}

export async function summarizePDF(
  file: File,
  maxLength: number = 500,
  minLength: number = 100,
): Promise<SummarizeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('max_length', maxLength.toString());
  formData.append('min_length', minLength.toString());

  const response = await fetch(`${API_V1}/ai/summarize`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<SummarizeResponse>(response);
}

export async function chatWithPDF(
  file: File,
  question: string,
  contextWindow: number = 5,
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('question', question);
  formData.append('context_window', contextWindow.toString());

  const response = await fetch(`${API_V1}/ai/chat`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ChatResponse>(response);
}

export async function translatePDF(
  file: File,
  sourceLanguage: string = 'en',
  targetLanguage: string = 'fr',
): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_language', sourceLanguage);
  formData.append('target_language', targetLanguage);

  const response = await fetch(`${API_V1}/ai/translate`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function searchPDF(
  file: File,
  query: string,
  topK: number = 5,
): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('query', query);
  formData.append('top_k', topK.toString());

  const response = await fetch(`${API_V1}/ai/search`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<SearchResponse>(response);
}

export async function getTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  const response = await fetch(`${API_V1}/tasks/${taskId}`);
  return handleResponse<TaskStatusResponse>(response);
}

export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(`${API_V1}/download/${fileId}`);
  if (!response.ok) {
    throw new PDFForgeAPIError(
      response.status,
      'File not found or has expired.',
    );
  }
  return response.blob();
}

export function getFullDownloadURL(downloadUrl: string): string {
  if (downloadUrl.startsWith('http')) return downloadUrl;
  return `${API_BASE}${downloadUrl}`;
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
