'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGridIcon, PlusCircleIcon, CogIcon, HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalTimer } from '@/contexts/TimerContext';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/templates', label: 'Templates', icon: LayoutGridIcon },
  { href: '/create', label: 'Create', icon: PlusCircleIcon },
  { href: '/settings', label: 'Settings', icon: CogIcon },
];

const BottomNavigation = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { timerState } = useGlobalTimer(); 

  if (typeof isMobile === 'undefined' || !isMobile) {
    return null;
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-md",
      "md:hidden", 
      "h-16"       
    )}>
      <div className={cn(
        "flex justify-around items-stretch h-full max-w-md mx-auto",
        "pb-[env(safe-area-inset-bottom)]" 
      )}>
        {navItems.map((item) => {
          let effectiveIsActive = pathname === item.href;
          // Special active state logic for /templates to cover /timer and /create
          if (item.href === '/templates' && (pathname === '/templates' || pathname.startsWith('/timer') || pathname.startsWith('/create'))) {
             effectiveIsActive = true;
          } else if (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/templates') {
             // For other items like /settings, /create (if not already covered by /templates for active state)
             effectiveIsActive = true;
          }
          // If on /templates page, the "Create" button itself shouldn't be marked active as part of the group
          if (item.href === '/create' && pathname.startsWith('/templates')) effectiveIsActive = false;


          const isHomeButton = item.href === '/';
          const isTimerSessionActive = timerState.isRunning || timerState.isPaused;
          const isDisabled = isHomeButton && isTimerSessionActive;

          const currentItemIsActiveAndNotDisabled = effectiveIsActive && !isDisabled;

          const iconClasses = cn("h-5 w-5 mb-0.5");
          // Text color will be inherited from the parent (Link or div)

          const linkContent = (
            <>
              <item.icon className={iconClasses} />
              {item.label}
            </>
          );

          const baseItemClasses = "flex flex-col items-center justify-center flex-1 text-xs p-1 transition-colors";

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className={cn(baseItemClasses, "text-muted-foreground opacity-60 cursor-not-allowed")}
                aria-disabled="true"
                role="button" // Semantically, it's like a button but disabled
              >
                {linkContent}
              </div>
            );
          } else {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  baseItemClasses,
                  currentItemIsActiveAndNotDisabled ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {linkContent}
              </Link>
            );
          }
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
