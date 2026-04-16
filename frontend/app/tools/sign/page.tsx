'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, Stamp } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useAddWatermark, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function SignTool() {
  const { files, lastResult } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [signatureName, setSignatureName] = useState('');

  const { mutate: addSign, isPending: isProcessing } = useAddWatermark();
  const { mutate: download, isPending: isDownloading } = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleSign = () => {
    if (!selectedFile || !signatureName) return;

    addSign({
      file: selectedFile.file,
      text: `Signed by: ${signatureName}`,
      options: {
        position: 'bottom-right',
        opacity: 0.8,
        font_size: 24,
        rotation: 0
      }
    });
  };

  const handleDownload = () => {
    if (!lastResult) return;
    download(lastResult);
  };

  return (
    <ToolWrapper
      title="Sign PDF"
      description="Add digital signatures to your PDF documents."
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
              <h3 className="text-lg font-semibold mb-4">Signature Settings</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Signature Name
              </label>
              <Input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Your full name"
                disabled={isProcessing}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSign}
                disabled={!selectedFile || !signatureName || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                <Stamp className="w-4 h-4" />
                {isProcessing ? 'Signing...' : 'Add Signature'}
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
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <FileSelector
            label="Select PDF to sign"
            placeholder="Choose a file to sign..."
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
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    File Name
                  </h4>
                  <p className="font-medium">{selectedFile.name}</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">
                    Your digital signature will be added to the bottom right of the document as a text stamp.
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
