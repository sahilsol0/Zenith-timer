
'use client';
import Link from 'next/link';
import { TimerIcon, CogIcon, PlusCircleIcon, LayoutGridIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode; }) => (
  <Button variant="ghost" asChild>
    <Link href={href} className="flex items-center w-full justify-start px-4 py-3 text-base sm:text-sm sm:px-2 sm:py-2">
      {children}
    </Link>
  </Button>
);

const Header = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Don't render header on mobile, BottomNavigation will be used
  }

  const navItems = (
    <>
      <NavLink href="/templates">
        <LayoutGridIcon className="mr-2 h-5 w-5 sm:mr-1 sm:h-4 sm:w-4" />
        Templates
      </NavLink>
      <NavLink href="/create">
        <PlusCircleIcon className="mr-2 h-5 w-5 sm:mr-1 sm:h-4 sm:w-4" />
        Create New
      </NavLink>
      <NavLink href="/settings">
        <CogIcon className="mr-2 h-5 w-5 sm:mr-1 sm:h-4 sm:w-4" />
        Settings
      </NavLink>
    </>
  );

  return (
    <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center">
          <TimerIcon className="mr-2 h-6 w-6 sm:h-7 sm:w-7" />
          Zenith Timer
        </Link>

        <div className="space-x-1 md:space-x-2">
          {navItems}
        </div>
      </nav>
    </header>
  );
};

export default Header;
