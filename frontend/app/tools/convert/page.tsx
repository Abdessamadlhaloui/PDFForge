'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useConvertPDF, useDownloadResult } from '@/lib/hooks/use-pdf-processing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formats = [
  { value: 'png', label: 'PNG Images (High-res)', category: 'Images' },
  { value: 'jpg', label: 'JPG Images', category: 'Images' },
  { value: 'webp', label: 'WebP Images', category: 'Images' },
  { value: 'tiff', label: 'TIFF Images', category: 'Images' },

  { value: 'docx', label: 'Microsoft Word (.docx)', category: 'Documents' },
  { value: 'xlsx', label: 'Microsoft Excel (.xlsx)', category: 'Documents' },
  { value: 'pptx', label: 'Microsoft PowerPoint (.pptx)', category: 'Documents' },
];

const categoryGroups = {
  Images: formats.filter((f) => f.category === 'Images'),
  Documents: formats.filter((f) => f.category === 'Documents'),
};

const dpiOptions = [
  { value: '72', label: '72 DPI (Web)' },
  { value: '150', label: '150 DPI (Draft)' },
  { value: '200', label: '200 DPI (Default)' },
  { value: '300', label: '300 DPI (Print)' },
  { value: '600', label: '600 DPI (High)' },
];

export default function ConvertTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [format, setFormat] = useState('png');
  const [dpi, setDpi] = useState('200');
  const [quality, setQuality] = useState('85');

  const convertMutation = useConvertPDF();
  const downloadMutation = useDownloadResult();

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const isProcessing = convertMutation.isPending;
  const result = convertMutation.data;
  const isImageFormat = ['png', 'jpg', 'jpeg', 'webp', 'tiff'].includes(format);

  const handleConvert = () => {
    if (!selectedFile) return;
    convertMutation.mutate({
      file: selectedFile.file,
      format,
      dpi: parseInt(dpi),
      quality: parseInt(quality),
    });
  };

  const handleDownload = () => {
    if (result) {
      downloadMutation.mutate(result);
    }
  };

  return (
    <ToolWrapper
      title="Convert PDF"
      description="Convert your PDF to Word, Excel, PowerPoint, or images."
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
              <h3 className="text-lg font-semibold mb-4">Conversion Settings</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Output Format</label>
              <Select value={format} onValueChange={setFormat} disabled={isProcessing}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryGroups).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category}
                      </div>
                      {items.map((fmt) => (
                        <SelectItem key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isImageFormat && (
              <div>
                <label className="block text-sm font-medium mb-3">Resolution</label>
                <Select value={dpi} onValueChange={setDpi} disabled={isProcessing}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dpiOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleConvert}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                {isProcessing ? 'Converting...' : 'Convert'}
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

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 rounded-lg border border-green-500/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-green-500">Conversion complete!</p>
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
            label="Select PDF to convert"
            placeholder="Choose a file to convert..."
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
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Format</h4>
                  <p className="font-medium">
                    {formats.find((f) => f.value === format)?.label}
                  </p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">
                    {isImageFormat
                      ? `Each page will be converted to a ${format.toUpperCase()} image at ${dpi} DPI. Result is a ZIP file.`
                      : `File will be converted to ${format.toUpperCase()} using LibreOffice for highest fidelity.`}
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
