'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Download, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useCompressPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

const qualityMap = {
  25: 'screen' as const,
  50: 'ebook' as const,
  75: 'printer' as const,
  100: 'prepress' as const,
};

const qualityLabels: Record<string, string> = {
  screen: 'Screen (smallest file)',
  ebook: 'eBook (recommended)',
  printer: 'Printer (high quality)',
  prepress: 'Prepress (maximum quality)',
};

function getClosestQuality(value: number): 'screen' | 'ebook' | 'printer' | 'prepress' {
  if (value <= 30) return 'screen';
  if (value <= 60) return 'ebook';
  if (value <= 85) return 'printer';
  return 'prepress';
}

export default function CompressTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [quality, setQuality] = useState([50]);

  const compressMutation = useCompressPDF();
  const downloadMutation = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const selectedQuality = getClosestQuality(quality[0]);
  const isProcessing = compressMutation.isPending;
  const result = compressMutation.data;

  const handleCompress = () => {
    if (!selectedFile) return;
    compressMutation.mutate({
      file: selectedFile.file,
      quality: selectedQuality,
    });
  };

  const handleDownload = () => {
    if (result) {
      downloadMutation.mutate(result);
    }
  };

  return (
    <ToolWrapper
      title="Compress PDF"
      description="Reduce file size while maintaining quality. Perfect for sharing and storage."
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
              <h3 className="text-lg font-semibold mb-4">Compression Settings</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Quality: <span className="text-accent">{qualityLabels[selectedQuality]}</span>
              </label>
              <Slider
                value={quality}
                onValueChange={setQuality}
                min={10}
                max={100}
                step={5}
                className="w-full mt-3"
                disabled={isProcessing}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Smaller</span>
                <span>Higher quality</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCompress}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isProcessing ? 'Compressing...' : 'Compress PDF'}
              </Button>
              <Button
                variant="outline"
                disabled={!result || downloadMutation.isPending}
                className="w-full gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                {downloadMutation.isPending ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="space-y-6">
            <FileSelector
              label="Select PDF to compress"
              placeholder="Choose a file to compress..."
              onFileSelect={setSelectedFileId}
            />

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-card border-2 border-accent/50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-green-500">Compression Complete</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Before</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {(result.original_size / 1024 / 1024).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">MB</div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-full bg-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-background rounded-lg border-2 border-accent">
                    <h4 className="text-xs font-semibold text-accent uppercase mb-3">After</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-accent">
                        {(result.processed_size / 1024 / 1024).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">MB</div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: `${(result.processed_size / result.original_size) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-accent/10 rounded-lg border border-accent/20 mt-4"
                >
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Space Saved</p>
                      <p className="text-lg font-bold text-accent">
                        {((result.original_size - result.processed_size) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reduction</p>
                      <p className="text-lg font-bold text-accent">
                        {(result.metadata as Record<string, unknown>)?.reduction_percent as string ??
                          (((result.original_size - result.processed_size) / result.original_size) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {selectedFile && !result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-card border border-border rounded-lg"
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">File Name</h4>
                    <p className="font-medium">{selectedFile.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Size</h4>
                    <p className="font-medium">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      Quality preset: <span className="font-semibold text-accent">{qualityLabels[selectedQuality]}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
