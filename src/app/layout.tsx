import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Correctly import Geist
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme-provider'; // Optional: if adding theme toggle later

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
      <body className={`${geist.variable} antialiased flex flex-col min-h-screen`}>
        {/* Optional: ThemeProvider for dark/light mode toggle if implemented 
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem> 
        */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
