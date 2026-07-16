import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { SiteChrome } from '@/components/site-chrome'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'CrisisEye — Ghana Emergency Coordination Platform',
  description:
    'CrisisEye is Ghana\u2019s intelligent emergency coordination platform, moving the nation from early warning to emergency response through real-time reporting, disaster awareness and coordinated agency dispatch.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0d1424',
}

import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { RoleSwitcher } from "@/components/dev/role-switcher";
import { OfflineQueueProvider } from "@/components/offline-queue-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <OfflineQueueProvider>
              <Suspense fallback={null}>
                <SiteChrome>{children}</SiteChrome>
              </Suspense>
              <RoleSwitcher />
            </OfflineQueueProvider>
          </ConvexClientProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
