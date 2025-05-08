
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
  const { isTimerActive } = useGlobalTimer();

  if (typeof isMobile === 'undefined' || !isMobile) {
    return null;
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-md", // z-30 to be below GlobalTimerBar (z-40)
      "md:hidden",
      "h-16", // Height of the navigation bar
      isTimerActive ? "bottom-16 md:bottom-0" : "bottom-0" // If timer bar is active (h-16), push this up
    )}>
      <div className={cn(
        "flex justify-around items-stretch h-full max-w-md mx-auto",
        "pb-[env(safe-area-inset-bottom)]"
      )}>
        {navItems.map((item) => {
          let effectiveIsActive = pathname === item.href;
          if (item.href === '/templates' && (pathname === '/templates' || pathname.startsWith('/timer') || pathname.startsWith('/create'))) {
             effectiveIsActive = true;
          } else if (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/templates') { // Ensure /templates doesn't make /create active
             effectiveIsActive = true;
          }
          if (item.href === '/create' && pathname.startsWith('/templates')) effectiveIsActive = false; // Fix for /create being active on /templates


          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 text-xs p-1 transition-colors",
                effectiveIsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", effectiveIsActive ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
