'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, Scissors, Loader2, CheckCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useSplitPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function SplitTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [pageRange, setPageRange] = useState('');

  const splitMutation = useSplitPDF();
  const downloadMutation = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const isProcessing = splitMutation.isPending;
  const result = splitMutation.data;

  const handleSplit = () => {
    if (!selectedFile || !pageRange) return;
    splitMutation.mutate({
      file: selectedFile.file,
      ranges: pageRange,
    });
  };

  const handleDownload = () => {
    if (result) {
      downloadMutation.mutate(result);
    }
  };

  return (
    <ToolWrapper
      title="Split PDF"
      description="Extract specific pages or divide your PDF into separate files."
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
              <h3 className="text-lg font-semibold mb-4">Split Settings</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Page Range (e.g., 1-5, 8, 10-15)
              </label>
              <Input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-3,5,7-10"
                disabled={isProcessing}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Separate multiple ranges with commas. The result will be a single combined PDF file.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSplit}
                disabled={!selectedFile || !pageRange || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                {isProcessing ? 'Splitting...' : 'Split PDF'}
              </Button>
              <Button
                variant="outline"
                disabled={!result || downloadMutation.isPending}
                className="w-full gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                {downloadMutation.isPending ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 rounded-lg border border-green-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-green-500">Split complete!</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Output: {result.filename} ({(result.processed_size / 1024 / 1024).toFixed(2)} MB)
                </p>
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
            label="Select PDF to split"
            placeholder="Choose a file to split..."
            onFileSelect={setSelectedFileId}
          />

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-card border border-border rounded-lg"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">File Name</h4>
                  <p className="font-medium">{selectedFile.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">File Size</h4>
                  <p className="font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">
                    Enter the page ranges you want to extract. Use hyphens for ranges (1-5) and
                    commas to separate groups (1-3,5,7-10). The extracted pages will be combined into a single PDF.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
