'use client';

import { useState } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Download, Merge, ArrowUp, ArrowDown, GripVertical, Loader2, CheckCircle } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { useMergePDFs, useDownloadResult } from '@/lib/hooks/use-pdf-processing';

export default function MergeTool() {
  const { files } = usePDFStore();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);

  const mergeMutation = useMergePDFs();
  const downloadMutation = useDownloadResult();

  const isProcessing = mergeMutation.isPending;
  const result = mergeMutation.data;

  const handleAddFile = (fileId: string) => {
    if (!selectedFileIds.includes(fileId)) {
      setSelectedFileIds((prev) => [...prev, fileId]);
      setMergeOrder((prev) => [...prev, fileId]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
    setMergeOrder((prev) => prev.filter((id) => id !== fileId));
  };

  const moveFileUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...mergeOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setMergeOrder(newOrder);
    }
  };

  const moveFileDown = (index: number) => {
    if (index < mergeOrder.length - 1) {
      const newOrder = [...mergeOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setMergeOrder(newOrder);
    }
  };

  const handleMerge = () => {
    if (mergeOrder.length < 2) return;

    const orderedFiles = mergeOrder
      .map((id) => files.find((f) => f.id === id))
      .filter(Boolean)
      .map((f) => f!.file);

    mergeMutation.mutate(orderedFiles);
  };

  const handleDownload = () => {
    if (result) {
      downloadMutation.mutate(result);
    }
  };

  return (
    <ToolWrapper
      title="Merge PDFs"
      description="Combine multiple PDF files into a single document."
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
              <h3 className="text-lg font-semibold mb-4">Merge Settings</h3>
              <p className="text-sm text-muted-foreground">
                Select at least 2 PDFs to merge
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleMerge}
                disabled={mergeOrder.length < 2 || isProcessing}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Merge className="w-4 h-4" />
                )}
                {isProcessing ? 'Merging...' : 'Merge PDFs'}
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
                  <p className="text-sm font-medium text-green-500">Merge complete!</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Output: {(result.processed_size / 1024 / 1024).toFixed(2)} MB
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                Select PDFs to merge ({selectedFileIds.length} selected)
              </label>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <motion.button
                    key={file.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      selectedFileIds.includes(file.id)
                        ? handleRemoveFile(file.id)
                        : handleAddFile(file.id);
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFileIds.includes(file.id)
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50 hover:bg-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedFileIds.includes(file.id)
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        }`}
                      >
                        {selectedFileIds.includes(file.id) && (
                          <span className="text-accent-foreground text-sm">✓</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {files.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                      Upload PDF files from the home page first
                    </p>
                  </div>
                )}
              </div>
            </div>

            {mergeOrder.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-card border border-border rounded-lg"
              >
                <h4 className="font-medium mb-4">Merge Order</h4>
                <div className="space-y-3">
                  {mergeOrder.map((fileId, index) => {
                    const file = files.find((f) => f.id === fileId);
                    return (
                      <motion.div
                        key={`${fileId}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-background rounded border border-border group hover:border-accent/50 transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-50" />
                        <span className="text-sm font-semibold text-accent w-6 h-6 flex items-center justify-center rounded bg-accent/20 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {((file?.size || 0) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveFileUp(index)}
                            disabled={index === 0}
                            className="p-1 hover:bg-accent/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveFileDown(index)}
                            disabled={index === mergeOrder.length - 1}
                            className="p-1 hover:bg-accent/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(fileId)}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive"
                          >
                            ✕
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-accent/10 rounded border border-accent/20">
                  <p className="text-xs text-muted-foreground">
                    Total size:{' '}
                    <span className="font-semibold text-accent">
                      {(
                        mergeOrder.reduce(
                          (sum, id) => sum + (files.find((f) => f.id === id)?.size || 0),
                          0,
                        ) /
                        1024 /
                        1024
                      ).toFixed(2)}{' '}
                      MB
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </ToolWrapper>
  );
}
