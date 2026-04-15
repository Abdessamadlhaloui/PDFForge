'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Image } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useConvertPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function PDFToJpegTool() {
  const { files, lastResult } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [quality, setQuality] = useState(85);

  const { mutate: convert, isPending: isProcessing } = useConvertPDF();
  const { mutate: download, isPending: isDownloading } = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleConvert = () => {
    if (!selectedFile) return;
    convert({ file: selectedFile.file, format: 'jpg', quality: quality });
  };

  const handleDownload = () => {
    if (!lastResult) return;
    download(lastResult);
  };

  return (
    <ToolWrapper
      title="PDF to JPEG"
      description="Convert PDF pages to JPEG images with adjustable quality"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2">Quality Settings</h3>
              <p className="text-xs text-muted-foreground">Balance quality and file size</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Quality: {quality}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>

              <div className="p-3 bg-accent/10 rounded border border-accent/20">
                <p className="text-xs font-semibold text-accent mb-1">Quality Level</p>
                <p className="text-xs">
                  {quality < 50 ? 'Low - Web optimized' : quality < 75 ? 'Medium - Balanced' : 'High - Best quality'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <Image className="w-4 h-4" />
                {isProcessing ? 'Converting...' : 'Convert to JPEG'}
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
                    <p className="font-semibold">JPEG (Compressed)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quality</p>
                    <p className="font-semibold">{quality}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-semibold">Lossy Compression</p>
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
