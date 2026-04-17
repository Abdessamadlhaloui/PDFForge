'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  index: number;
}

export function ToolCard({ title, description, icon: Icon, href, index }: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href}>
        <div className="relative h-full p-6 rounded-xl border border-border bg-card hover:bg-card/80 transition-all cursor-pointer group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Icon className="w-6 h-6 text-accent" />
            </div>

            <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
              {description}
            </p>

            <div className="mt-4 inline-flex items-center text-accent opacity-0 group-hover:opacity-100 transition-all gap-2 text-sm font-medium">
              Learn more
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
