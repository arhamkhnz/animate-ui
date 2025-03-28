import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

import './global.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Animate UI - Animated React Components',
  description:
    'A fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, and Motion. Create fluid and engaging user interfaces easily and quickly.',
  keywords: [
    'Animate UI',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Framer Motion',
    'Open-source components',
    'Animated UI components',
    'UI library',
  ],
  openGraph: {
    title: 'Animate UI - Animated React Components',
    description:
      'A fully animated, open-source component library built with React, TypeScript, Tailwind CSS, and Motion.',
    url: 'https://www.animate-ui.com',
    siteName: 'Animate UI',
    images: [
      {
        url: 'https://www.animate-ui.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Animate UI - Animated React Components',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          theme={{
            defaultTheme: 'dark',
          }}
        >
          <Providers>{children}</Providers>
        </RootProvider>
      </body>
    </html>
  );
}
