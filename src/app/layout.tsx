import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import BottomNavigation from '@/components/layout/BottomNavigation'; // Import BottomNavigation
import { cn } from '@/lib/utils';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'Zenith Timer',
  description: 'Customizable timer sequences for productivity and well-being.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased flex flex-col min-h-screen bg-background`}>
        <Header /> {/* Header will hide itself on mobile */}
        <main className={cn(
          "flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8",
          "pb-16 md:pb-0" // Add padding-bottom for mobile to account for BottomNavigation, remove for md+
        )}>
          {children}
        </main>
        <BottomNavigation /> {/* BottomNavigation will show itself only on mobile */}
        <Toaster />
      </body>
    </html>
  );
}
