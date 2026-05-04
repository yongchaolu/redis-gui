import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({children, className, style}: {children: React.ReactNode; className?: string; style?: React.CSSProperties}) => (
  <div className={cn("bg-surface ghost-border rounded-lg p-4", className)} style={style}>
    {children}
  </div>
);

export const Badge = ({children, className, style}: {children: React.ReactNode; className?: string; style?: React.CSSProperties}) => (
  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", className)} style={style}>
    {children}
  </span>
);
