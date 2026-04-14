'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  FileText,
  Merge,
  Scissors,
  Image,
  Pen,
  Stamp,
  RotateCw,
  Sparkles,
  FileCode,
  TableIcon,
  Presentation,
  BookOpen,
  Code,
} from 'lucide-react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolCard } from '@/components/tool-card';
import { Button } from '@/components/ui/button';
import { usePDFStore } from '@/lib/store';

const tools = [
  {
    title: 'AI Studio',
    description: 'Chat, summarize, and translate with AI',
    icon: Sparkles,
    href: '/tools/ai-studio',
  },
  {
    title: 'Compress',
    description: 'Reduce file size while maintaining quality',
    icon: Zap,
    href: '/tools/compress',
  },
  {
    title: 'Merge',
    description: 'Combine multiple PDFs into one',
    icon: Merge,
    href: '/tools/merge',
  },
  {
    title: 'Split',
    description: 'Extract pages or divide your PDF',
    icon: Scissors,
    href: '/tools/split',
  },
  {
    title: 'PDF to Word',
    description: 'Convert to editable .docx files',
    icon: FileText,
    href: '/tools/pdf-to-word',
  },
  {
    title: 'PDF to PowerPoint',
    description: 'Create .pptx presentations',
    icon: Presentation,
    href: '/tools/pdf-to-powerpoint',
  },
  {
    title: 'PDF to PNG',
    description: 'High-res lossless images',
    icon: Image,
    href: '/tools/pdf-to-png',
  },
  {
    title: 'PDF to JPEG',
    description: 'Compressed image format',
    icon: Image,
    href: '/tools/pdf-to-jpeg',
  },
  {
    title: 'PDF to Text',
    description: 'Plain text extraction',
    icon: FileText,
    href: '/tools/pdf-to-txt',
  },
  {
    title: 'Edit',
    description: 'Rotate, delete, or reorder pages',
    icon: Pen,
    href: '/tools/edit',
  },
  {
    title: 'Sign',
    description: 'Add digital signatures to PDFs',
    icon: Stamp,
    href: '/tools/sign',
  },
  {
    title: 'Watermark',
    description: 'Add text or image watermarks',
    icon: FileText,
    href: '/tools/watermark',
  },
  {
    title: 'Rotate',
    description: 'Change page orientation',
    icon: RotateCw,
    href: '/tools/rotate',
  },
];

export default function Home() {
  const { files } = usePDFStore();
  const [showUpload, setShowUpload] = useState(true);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-card/30">
      <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold">PDFForge</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button variant="outline" size="sm">
              GitHub
            </Button>
          </motion.div>
        </div>
      </nav>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-pretty">Your Free PDF</span>
              <br />
              <span className="bg-gradient-to-r from-accent to-accent/50 bg-clip-text text-transparent">
                Processing Suite
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Fast, secure, and completely free. Process your PDFs online without
              downloading any software.
            </p>
          </motion.div>

          {showUpload && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <FileUploadZone />
            </motion.div>
          )}

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <p className="text-sm text-muted-foreground mb-4">
                {files.length} file{files.length !== 1 ? 's' : ''} ready to process
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {tools.slice(0, 4).map((tool) => (
                  <Button
                    key={tool.href}
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-accent hover:text-accent-foreground"
                  >
                    <a href={tool.href}>{tool.title}</a>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">All Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
              Choose from our complete suite of PDF processing tools
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool, index) => (
              <ToolCard
                key={tool.href}
                {...tool}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose PDFForge?</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: '100% Free',
                description: 'No hidden costs, no premium features. All tools are completely free to use.',
              },
              {
                title: 'Secure & Private',
                description:
                  'Your files are processed securely and deleted immediately after processing.',
              },
              {
                title: 'Lightning Fast',
                description:
                  'Advanced algorithms ensure your PDFs are processed in seconds.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4 sm:mb-0"
            >
              <div className="w-6 h-6 bg-gradient-to-br from-accent to-accent/50 rounded-md flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-semibold">PDFForge</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center sm:items-end gap-2"
            >
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span>Created by <a href="https://www.linkedin.com/in/abdessamad-lahlaoui-315615253/" target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">Abdessamad Lahlaoui</a></span>
                <span className="hidden sm:inline">•</span>
                <a href="mailto:abdessamadlahlaoui0@gmail.com" className="hover:text-foreground transition-colors">abdessamadlahlaoui0@gmail.com</a>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} PDFForge. All rights reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </footer>
    </main>
  );
}
