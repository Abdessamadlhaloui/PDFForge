'use client';

import { useState, useEffect } from 'react';
import { ToolWrapper } from '@/components/tool-wrapper';
import { FileSelector } from '@/components/file-selector';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Pen, X, Copy, RotateCw, Eye, Type, Highlighter, Pencil, Stamp, Ban } from 'lucide-react';
import { usePDFStore } from '@/lib/store';
import { deletePages } from '@/lib/api';
import { usePDFMetadata, useDownloadResult } from '@/lib/hooks/use-pdf-processing';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function EditTool() {
  const { files } = usePDFStore();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [pages, setPages] = useState<{ id: number; number: number; deleted: boolean; rotated: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [editMode, setEditMode] = useState<'view' | 'text' | 'highlight' | 'draw' | 'annotate' | 'redact' | 'image'>('view');

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const { mutate: getMetadata, isPending: isLoadingMetadata } = usePDFMetadata();
  const { mutate: downloadResult, isPending: isDownloading } = useDownloadResult();

  const deletePagesMutation = useMutation({
    mutationFn: (pagesToDelete: number[]) => deletePages(selectedFile!, pagesToDelete),
    onSuccess: (data) => {
      toast.success('Pages deleted successfully!');
      downloadResult(data);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to delete pages';
      toast.error(message);
    },
  });

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    getMetadata(file, {
      onSuccess: (meta) => {
        setPages(
          Array.from({ length: meta.page_count }, (_, i) => ({
            id: i,
            number: i + 1,
            deleted: false,
            rotated: 0,
          }))
        );
        setCurrentPage(0);
      }
    });
  };

  const togglePageDelete = (id: number) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, deleted: !p.deleted } : p))
    );
  };

  const rotatePage = (id: number) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotated: (p.rotated + 90) % 360 } : p))
    );
  };

  const handleSave = () => {
    if (!selectedFile) return;
    const deletedPages = pages.filter((p) => p.deleted).map(p => p.number);

    if (deletedPages.length === 0) {
      toast.info("No pages were marked for deletion.");
      return;
    }
    if (deletedPages.length === pages.length) {
      toast.error("You cannot delete all pages!");
      return;
    }

    deletePagesMutation.mutate(deletedPages);
  };

  const editModes = [
    { id: 'view', label: 'View', icon: Eye },
    { id: 'text', label: 'Add Text', icon: Type },
    { id: 'highlight', label: 'Highlight', icon: Highlighter },
    { id: 'draw', label: 'Draw', icon: Pencil },
    { id: 'annotate', label: 'Annotate', icon: Stamp },
    { id: 'redact', label: 'Redact', icon: Ban },
  ];

  return (
    <ToolWrapper
      title="PDF Editor"
      description="Select and delete pages from your PDF file"
    >
      <FileSelector
        label="Select PDF to edit"
        placeholder="Choose a file to edit..."
        onFileSelect={handleFileSelect}
      />

      {isLoadingMetadata && <p className="mt-4 text-sm text-muted-foreground text-center animate-pulse">Loading Document...</p>}

      {selectedFile && pages.length > 0 && (
        <div className="mt-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-40 bg-card/95 backdrop-blur border border-border rounded-lg p-4 shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                <p className="text-sm text-foreground">Click the trash icon to mark a page for deletion.</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={!selectedFile || deletePagesMutation.isPending || isDownloading}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full md:w-auto"
              >
                <Download className="w-4 h-4" />
                {deletePagesMutation.isPending ? 'Processing...' : 'Apply Details & Download'}
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 order-2 lg:order-1"
            >
              <div className="sticky top-32 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-3">Pages ({pages.length})</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {pages.filter((p) => !p.deleted).length} will be kept
                  </p>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  <AnimatePresence>
                    {pages.map((page) => (
                      <motion.div
                        key={page.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`relative aspect-[4/5] rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all group ${
                          currentPage === page.id
                            ? 'border-accent bg-accent/10'
                            : page.deleted
                            ? 'border-destructive bg-destructive/10'
                            : 'border-border hover:border-accent/50'
                        }`}
                        onClick={() => !page.deleted && setCurrentPage(page.id)}
                      >
                        <div className="text-center pointer-events-none">
                          <p className="font-semibold text-xs">{page.number}</p>
                          {page.rotated > 0 && (
                            <p className="text-xs text-muted-foreground">{page.rotated}°</p>
                          )}
                        </div>
                        {page.deleted && (
                          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-lg">
                            <X className="w-4 h-4 text-destructive" />
                          </div>
                        )}
                        {!page.deleted && (
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePageDelete(page.id);
                              }}
                              className="p-1 bg-destructive/20 hover:bg-destructive/30 rounded text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 order-1 lg:order-2"
            >
              <div className="bg-card border border-border rounded-lg p-6 min-h-96 flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-32 bg-muted rounded-lg flex items-center justify-center mx-auto border-2 border-dashed border-border flex-col p-4">
                    <Pen className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-[10px] font-mono text-muted-foreground break-all">Page {pages[currentPage]?.number}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Page Selection</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                      Use the sidebar on the left to select pages you wish to remove from the final document.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </ToolWrapper>
  );
}
