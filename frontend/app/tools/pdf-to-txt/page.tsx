'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { extractText } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PDFToTxtTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [textContent, setTextContent] = useState<string | null>(null);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const extractMutation = useMutation({
    mutationFn: (file: File) => extractText(file, undefined, false),
    onSuccess: (data) => {
      setTextContent(data.text);
      toast.success('Text extracted successfully!');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to extract text';
      toast.error(message);
    },
  });

  const handleConvert = () => {
    if (!selectedFile) return;
    extractMutation.mutate(selectedFile.file);
  };

  const handleDownload = () => {
    if (!textContent || !selectedFile) return;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name.replace('.pdf', '.txt');
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <ToolWrapper
      title="PDF to Text"
      description="Extract all text from PDF as plain text file"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2">Text Extraction</h3>
              <p className="text-xs text-muted-foreground">Convert PDF content to plain text</p>
            </div>

            <div className="p-4 bg-accent/10 rounded border border-accent/20 space-y-2">
              <p className="text-xs font-semibold text-accent">Features:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Extract all text content</li>
                <li>• Clean plain text output</li>
                <li>• Universal compatibility</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || extractMutation.isPending}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <FileText className="w-4 h-4" />
                {extractMutation.isPending ? 'Extracting...' : 'Convert to Text'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                disabled={!textContent}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Download Text
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <FileSelector
            label="Select PDF to convert"
            placeholder="Choose a PDF file..."
            onFileSelect={setSelectedFileId}
          />

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-card border border-border rounded-lg"
            >
              <h3 className="font-semibold mb-4">Conversion Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Input Format</p>
                    <p className="font-semibold">PDF</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Output Format</p>
                    <p className="font-semibold">Plain Text (.txt)</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">File Size</p>
                  <p className="text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {textContent && (
                    <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">Extracted Length</p>
                        <p className="text-sm font-semibold">{textContent.length.toLocaleString()} characters</p>
                    </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
