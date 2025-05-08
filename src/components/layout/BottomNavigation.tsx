'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGridIcon, PlusCircleIcon, CogIcon, HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/templates', label: 'Templates', icon: LayoutGridIcon },
  { href: '/create', label: 'Create', icon: PlusCircleIcon },
  { href: '/settings', label: 'Settings', icon: CogIcon },
];

const BottomNavigation = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (typeof isMobile === 'undefined' || !isMobile) { // Also check for undefined to prevent flash on initial load
    return null;
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-md",
      "md:hidden", // Ensure it's hidden on medium screens and up by Tailwind
      "h-16" // Height of the navigation bar
    )}>
      <div className={cn(
        "flex justify-around items-stretch h-full max-w-md mx-auto", // items-stretch for full height touch targets
        "pb-[env(safe-area-inset-bottom)]" // Add padding for notch on iOS devices
      )}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/templates' && pathname.startsWith('/timer')) || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/templates');
          // Special handling for /templates to be active also on /timer page
          // General rule: exact match or startsWith for non-root paths.
          // Refined active logic:
          // - Exact match for '/'
          // - For /templates, active if pathname is /templates OR /timer
          // - For other paths, startsWith
          let effectiveIsActive = pathname === item.href;
          if (item.href === '/templates' && (pathname === '/templates' || pathname.startsWith('/timer') || pathname.startsWith('/create'))) {
             effectiveIsActive = true;
          } else if (item.href !== '/' && pathname.startsWith(item.href)) {
             effectiveIsActive = true;
          }


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
