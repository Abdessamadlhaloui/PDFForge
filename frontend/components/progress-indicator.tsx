'use client';

import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle, Loader } from 'lucide-react';

interface ProgressIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  label?: string;
}

export function ProgressIndicator({
  status,
  progress,
  label,
}: ProgressIndicatorProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
    },
    processing: {
      icon: Loader,
      color: 'text-accent',
      bgColor: 'bg-accent/20',
    },
    completed: {
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
    },
    error: {
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/20',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <motion.div
            animate={status === 'processing' ? { rotate: 360 } : {}}
            transition={{
              duration: status === 'processing' ? 2 : 0,
              repeat: status === 'processing' ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </motion.div>
        </div>
        <div>
          <p className="font-medium capitalize">{status}</p>
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-accent to-accent/50 rounded-full"
        />
      </div>

      <p className="text-xs text-muted-foreground text-right">{progress}% complete</p>
    </motion.div>
  );
}
