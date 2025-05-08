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
    sm: 'h-24 w-24 text-sm',
    md: 'h-36 w-36 text-lg',
    lg: 'h-48 w-48 text-xl',
  };

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full flex flex-col justify-center items-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md",
        // Subtle radial gradient effect using pseudo-elements might be overly complex for Tailwind.
        // Instead, using a simple background with hover states.
        // For an actual radial gradient on the button itself that changes on hover, custom CSS or more complex Tailwind is needed.
        // This approach uses solid colors from the theme.
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn("mb-1", size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10')} />}
      {text && <span>{text}</span>}
    </button>
  );
};

export default CircleButton;
