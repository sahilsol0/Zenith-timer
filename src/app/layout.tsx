
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Import Inter
import './globals.css';
import { TimerProvider } from '@/contexts/TimerContext';
import AppShell from '@/components/layout/AppShell';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Instantiate Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define a CSS variable for Inter
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
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}> {/* Use Inter font variable */}
        <ThemeProvider>
          <TimerProvider> {/* TimerProvider wraps AppShell */}
            <AppShell>{children}</AppShell>
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
