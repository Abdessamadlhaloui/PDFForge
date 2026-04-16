'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Download, RotateCw, Loader2, CheckCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useRotatePDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RotateTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [pages, setPages] = useState('');
  const [angle, setAngle] = useState('90');

  const rotateMutation = useRotatePDF();
  const downloadMutation = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const isProcessing = rotateMutation.isPending;
  const result = rotateMutation.data;

  const handleRotate = () => {
    if (!selectedFile || !pages) return;
    const pageList = pages.split(',').map((p) => parseInt(p.trim())).filter((n) => !isNaN(n));
    rotateMutation.mutate({
      file: selectedFile.file,
      pages: pageList,
      angle: parseInt(angle),
    });
  };

  const handleDownload = () => {
    if (result) downloadMutation.mutate(result);
  };

  return (
    <ToolWrapper
      title="Rotate PDF"
      description="Rotate specific pages in your PDF document."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold">Rotation Settings</h3>

            <div>
              <label className="block text-sm font-medium mb-3">Pages to rotate</label>
              <Input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g., 1,3,5"
                disabled={isProcessing}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Comma-separated page numbers (1-indexed)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Rotation Angle</label>
              <Select value={angle} onValueChange={setAngle} disabled={isProcessing}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90° Clockwise</SelectItem>
                  <SelectItem value="180">180°</SelectItem>
                  <SelectItem value="270">270° Clockwise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRotate}
                disabled={!selectedFile || !pages || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                {isProcessing ? 'Rotating...' : 'Rotate Pages'}
              </Button>
              <Button variant="outline" disabled={!result} className="w-full gap-2" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-green-500">Rotation complete!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <FileSelector label="Select PDF to rotate" placeholder="Choose a file..." onFileSelect={setSelectedFileId} />
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
