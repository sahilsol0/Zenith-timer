import Link from 'next/link';
import { TimerIcon, CogIcon, PlusCircleIcon, LayoutGridIcon } from 'lucide-react'; // Changed Home to LayoutGrid for Templates
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center">
          <TimerIcon className="mr-2 h-7 w-7" />
          Zenith Timer
        </Link>
        <div className="space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/templates" className="flex items-center">
              <LayoutGridIcon className="mr-1 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/create" className="flex items-center">
              <PlusCircleIcon className="mr-1 h-4 w-4" />
              Create New
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/settings" className="flex items-center">
              <CogIcon className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
