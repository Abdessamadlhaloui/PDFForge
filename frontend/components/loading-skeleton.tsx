'use client';

import { motion } from 'framer-motion';

export function FileUploadSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="border-2 border-border rounded-lg p-12 bg-card/30 h-[200px]"
      />
    </div>
  );
}

export function FileListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          className="h-16 bg-card border border-border rounded-lg"
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="h-32 bg-card border border-border rounded-lg"
    />
  );
}

export function PageGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
          className="aspect-[4/5] bg-card border border-border rounded-lg"
        />
      ))}
    </div>
  );
}
