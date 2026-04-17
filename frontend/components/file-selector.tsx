'use client';

import { usePDFStore } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FileSelectorProps {
  onFileSelect?: (fileId: string) => void;
  label?: string;
  placeholder?: string;
}

export function FileSelector({
  onFileSelect,
  label = 'Select a PDF file',
  placeholder = 'Choose a file...',
}: FileSelectorProps) {
  const { files } = usePDFStore();

  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 bg-card border border-dashed border-border rounded-lg text-center"
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
        <p className="text-muted-foreground mb-6">
          Please upload a PDF file first from the home page
        </p>
        <Link href="/">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Upload PDF
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-3">{label}</label>
        <Select onValueChange={onFileSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {files.map((file) => (
              <SelectItem key={file.id} value={file.id}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs text-muted-foreground">
        {files.length} file{files.length !== 1 ? 's' : ''} available
      </div>
    </motion.div>
  );
}
