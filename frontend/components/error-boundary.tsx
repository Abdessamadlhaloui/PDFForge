'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorBoundaryProps {
  error?: string;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function ErrorState({
  error = 'Something went wrong',
  title = 'Error',
  description = 'An unexpected error occurred. Please try again.',
  showHomeButton = true,
}: ErrorBoundaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      <div className="mb-6 p-4 rounded-full bg-destructive/10">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {error && (
        <p className="text-sm text-destructive mb-6 p-3 bg-destructive/10 rounded-lg max-w-md">
          {error}
        </p>
      )}
      {showHomeButton && (
        <Link href="/">
          <Button className="gap-2">Go Home</Button>
        </Link>
      )}
    </motion.div>
  );
}

export function LoadingState({ message = 'Processing...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full mb-4"
      />
      <p className="text-lg font-medium text-muted-foreground">{message}</p>
    </motion.div>
  );
}
