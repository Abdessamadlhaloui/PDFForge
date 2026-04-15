'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Image } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useConvertPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function PDFToPNGTool() {
  const { files, lastResult } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [resolution, setResolution] = useState('300');

  const { mutate: convert, isPending: isProcessing } = useConvertPDF();
  const { mutate: download, isPending: isDownloading } = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleConvert = () => {
    if (!selectedFile) return;
    convert({ file: selectedFile.file, format: 'png', dpi: parseInt(resolution) });
  };

  const handleDownload = () => {
    if (!lastResult) return;
    download(lastResult);
  };

  return (
    <ToolWrapper
      title="PDF to PNG"
      description="Convert PDF pages to high-resolution PNG images with transparency support"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2">Image Settings</h3>
              <p className="text-xs text-muted-foreground">Configure output quality and resolution</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Resolution (DPI)</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="72">72 DPI - Web</option>
                  <option value="150">150 DPI - Standard</option>
                  <option value="300">300 DPI - Print Quality</option>
                  <option value="600">600 DPI - High Quality</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">Higher DPI = larger file size</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <Image className="w-4 h-4" />
                {isProcessing ? 'Converting...' : 'Convert to PNG'}
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
                    <p className="font-semibold">PNG (Lossless)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                    <p className="font-semibold">{resolution} DPI</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quality</p>
                    <p className="font-semibold">Lossless</p>
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
