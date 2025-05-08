'use client';
import Link from 'next/link';
import { TimerIcon, CogIcon, PlusCircleIcon, LayoutGridIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming this hook exists
import { useState } from 'react';

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
  <Button variant="ghost" asChild onClick={onClick}>
    <Link href={href} className="flex items-center w-full justify-start px-4 py-3 text-base sm:text-sm sm:px-2 sm:py-2">
      {children}
    </Link>
  </Button>
);

const Header = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const closeSheet = () => setIsSheetOpen(false);

  const navItems = (
    <>
      <NavLink href="/templates" onClick={closeSheet}>
        <LayoutGridIcon className="mr-2 h-5 w-5 sm:mr-1 sm:h-4 sm:w-4" />
        Templates
      </NavLink>
      <NavLink href="/create" onClick={closeSheet}>
        <PlusCircleIcon className="mr-2 h-5 w-5 sm:mr-1 sm:h-4 sm:w-4" />
        Create New
      </NavLink>
      <NavLink href="/settings" onClick={closeSheet}>
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

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-card p-0">
              <div className="flex flex-col space-y-1 pt-6">
                {navItems}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="space-x-1 md:space-x-2">
            {navItems}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
