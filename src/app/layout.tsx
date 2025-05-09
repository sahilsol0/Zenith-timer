
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { TimerProvider } from '@/contexts/TimerContext';
import AppShell from '@/components/layout/AppShell'; // Import the new AppShell component

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
        <TimerProvider> {/* TimerProvider wraps AppShell */}
          <AppShell>{children}</AppShell>
        </TimerProvider>
      </body>
    </html>
  );
}
