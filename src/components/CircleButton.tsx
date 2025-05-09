import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const CircleButton = ({ 
  onClick, 
  disabled = false,
  text,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: CircleButtonProps) => {
  
  const sizeClasses = {
    sm: 'h-16 w-16 sm:h-20 sm:w-20 text-xs',
    md: 'h-20 w-20 sm:h-28 sm:w-28 text-sm',
    lg: 'h-28 w-28 sm:h-36 sm:w-36 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4 sm:h-5 sm:w-5',
    md: 'h-5 w-5 sm:h-6 sm:w-6',
    lg: 'h-6 w-6 sm:h-8 sm:w-8',
  }

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-accent text-accent bg-transparent hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full flex flex-col justify-center items-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn("mb-1", iconSizeClasses[size])} />}
      {text && <span>{text}</span>}
    </button>
  );
};

export default CircleButton;
