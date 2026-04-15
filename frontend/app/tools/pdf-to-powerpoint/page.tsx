'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Presentation } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useConvertPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function PDFToPowerPointTool() {
  const { files, lastResult } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [onePagePerSlide, setOnePagePerSlide] = useState(true);

  const { mutate: convert, isPending: isProcessing } = useConvertPDF();
  const { mutate: download, isPending: isDownloading } = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleConvert = () => {
    if (!selectedFile) return;
    convert({ file: selectedFile.file, format: 'pptx' });
  };

  const handleDownload = () => {
    if (!lastResult) return;
    download(lastResult);
  };

  return (
    <ToolWrapper
      title="PDF to PowerPoint"
      description="Convert PDF pages into Microsoft PowerPoint (.pptx) presentation slides"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <div>
              <h3 className="text-lg font-semibold mb-2">Slide Layout</h3>
              <p className="text-xs text-muted-foreground">Choose how to organize slides</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={onePagePerSlide}
                    onChange={() => setOnePagePerSlide(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">One page per slide</span>
                </label>
                <p className="text-xs text-muted-foreground ml-7">Each PDF page becomes a slide</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={!onePagePerSlide}
                    onChange={() => setOnePagePerSlide(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Multiple pages per slide</span>
                </label>
                <p className="text-xs text-muted-foreground ml-7">Condense pages for overview</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <Presentation className="w-4 h-4" />
                {isProcessing ? 'Converting...' : 'Convert to PowerPoint'}
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
                    <p className="font-semibold">PowerPoint (.pptx)</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Slide Layout</p>
                  <p className="text-sm">{onePagePerSlide ? 'Each PDF page will become an individual slide' : 'Multiple pages will be condensed into fewer slides'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
