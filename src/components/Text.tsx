'use client'
// components/Text.tsx

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export function Text({ children, className }: TextProps) {
  return (
    <p className={cn('text-tremor-default text-tremor-content dark:text-dark-tremor-content', className)}>
      {children}
    </p>
  );
}