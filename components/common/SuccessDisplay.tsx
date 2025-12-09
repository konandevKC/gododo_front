'use client';

import { CheckCircle, Sparkles } from 'lucide-react';

interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
}

export default function SuccessDisplay({ message, onDismiss }: SuccessDisplayProps) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 relative">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <Sparkles className="w-3 h-3 text-green-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-green-800 dark:text-green-300 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

