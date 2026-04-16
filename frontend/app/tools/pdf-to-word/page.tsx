'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useConvertPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function PDFToWordTool() {
  const { files, lastResult } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [preserveFormatting, setPreserveFormatting] = useState(true);

  const { mutate: convert, isPending: isProcessing } = useConvertPDF();
  const { mutate: download, isPending: isDownloading } = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleConvert = () => {
    if (!selectedFile) return;
    convert({ file: selectedFile.file, format: 'docx' });
  };

  const handleDownload = () => {
    if (!lastResult) return;
    download(lastResult);
  };

  return (
    <ToolWrapper
      title="PDF to Word"
      description="Convert PDF files to editable Microsoft Word (.docx) documents"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2">Conversion Settings</h3>
              <p className="text-xs text-muted-foreground">Customize how your PDF is converted</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveFormatting}
                    onChange={(e) => setPreserveFormatting(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm font-medium">Preserve formatting</span>
                </label>
                <p className="text-xs text-muted-foreground ml-7">Keep original layout and styles</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <FileText className="w-4 h-4" />
                {isProcessing ? 'Converting...' : 'Convert to Word'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                disabled={!lastResult || isDownloading || isProcessing}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Downloading...' : 'Download Result'}
              </Button>
            </div>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-accent/10 rounded border border-accent/20"
              >
                <p className="text-xs font-semibold text-accent mb-1">File Info</p>
                <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
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
                    <p className="font-semibold">Microsoft Word (.docx)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">File Size</p>
                    <p className="font-semibold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Preserve Formatting</p>
                    <p className="font-semibold">{preserveFormatting ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
