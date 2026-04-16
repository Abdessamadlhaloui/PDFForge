'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Download, Droplets, Loader2, CheckCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useAddWatermark, useDownloadResult } from '@/lib/hooks/use-pdf-processing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function WatermarkTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState('diagonal');
  const [opacity, setOpacity] = useState([30]);
  const [fontSize, setFontSize] = useState([48]);
  const [color, setColor] = useState('#808080');

  const watermarkMutation = useAddWatermark();
  const downloadMutation = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const isProcessing = watermarkMutation.isPending;
  const result = watermarkMutation.data;

  const handleAddWatermark = () => {
    if (!selectedFile || !text) return;
    watermarkMutation.mutate({
      file: selectedFile.file,
      text,
      options: {
        position,
        opacity: opacity[0] / 100,
        font_size: fontSize[0],
        color,
      },
    });
  };

  const handleDownload = () => {
    if (result) downloadMutation.mutate(result);
  };

  return (
    <ToolWrapper
      title="Add Watermark"
      description="Add a text watermark to all pages of your PDF."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-5 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold">Watermark Settings</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Watermark Text</label>
              <Input
               value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., CONFIDENTIAL"
                disabled={isProcessing}
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <Select value={position} onValueChange={setPosition} disabled={isProcessing}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Opacity: {opacity[0]}%
              </label>
              <Slider value={opacity} onValueChange={setOpacity} min={5} max={100} step={5} disabled={isProcessing} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Font Size: {fontSize[0]}px
              </label>
              <Slider value={fontSize} onValueChange={setFontSize} min={8} max={200} step={4} disabled={isProcessing} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                  disabled={isProcessing}
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="bg-background border-border flex-1" disabled={isProcessing} />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAddWatermark}
                disabled={!selectedFile || !text || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                {isProcessing ? 'Adding...' : 'Add Watermark'}
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
                  <p className="text-sm font-medium text-green-500">Watermark added!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <FileSelector label="Select PDF" placeholder="Choose a file..." onFileSelect={setSelectedFileId} />

          {selectedFile && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-6 bg-card border border-border rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Preview</h4>
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center border border-border relative overflow-hidden">
                <p className="text-muted-foreground text-sm">{selectedFile.name}</p>
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    transform: position === 'diagonal' ? 'rotate(-45deg)' : undefined,
                  }}
                >
                  <span
                    style={{
                      fontSize: `${Math.min(fontSize[0], 60)}px`,
                      color: color,
                      opacity: opacity[0] / 100,
                      fontWeight: 'bold',
                    }}
                  >
                    {text}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
