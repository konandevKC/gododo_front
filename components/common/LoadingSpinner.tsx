'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        <div className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}></div>
        <div className={`absolute top-0 left-0 ${sizes[size]} border-4 border-transparent border-t-primary/50 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
      </div>
      {message && (
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>
      )}
    </div>
  );
}

